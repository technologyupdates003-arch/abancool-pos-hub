import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

const formatPhoneNumber = (phoneNumber: string) =>
  phoneNumber.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");

const normalizeEnvironment = (value: string | undefined) => {
  const raw = (value || "").toLowerCase().trim();
  return ["live", "production", "prod"].includes(raw) ? "live" : "sandbox";
};

const getKeyMode = (value: string) => {
  if (value.includes("_live_")) return "live";
  if (value.includes("_test_")) return "test";
  return "unknown";
};

const resolveIntaSendCredentials = (
  firstKey: string,
  secondKey: string,
  environment: "live" | "sandbox",
) => {
  const expectedMode = environment === "live" ? "live" : "test";
  const candidates = [firstKey, secondKey];
  const modeMatched = candidates.filter((key) => getKeyMode(key) === expectedMode);

  const secretToken = modeMatched.find((key) => key.startsWith(`ISSecretKey_${expectedMode}_`));
  const publishableToken = modeMatched.find((key) => key.startsWith(`ISPubKey_${expectedMode}_`));

  return {
    expectedMode,
    secretToken,
    publishableToken,
    firstKeyMode: getKeyMode(firstKey),
    secondKeyMode: getKeyMode(secondKey),
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const INTASEND_API_KEY = Deno.env.get("INTASEND_API_KEY");
    const INTASEND_PUBLISHABLE_KEY = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    const INTASEND_ENVIRONMENT = normalizeEnvironment(Deno.env.get("INTASEND_ENVIRONMENT"));

    if (!INTASEND_API_KEY || !INTASEND_PUBLISHABLE_KEY) {
      return jsonResponse({ error: "IntaSend keys not configured" }, 500);
    }

    const credentials = resolveIntaSendCredentials(
      INTASEND_API_KEY,
      INTASEND_PUBLISHABLE_KEY,
      INTASEND_ENVIRONMENT,
    );

    if (!credentials.secretToken || !credentials.publishableToken) {
      return jsonResponse({
        error: "IntaSend key/environment mismatch",
        details: `Environment is ${INTASEND_ENVIRONMENT}. Expected one live/test secret key and one matching publishable key. Found key modes: INTASEND_API_KEY=${credentials.firstKeyMode}, INTASEND_PUBLISHABLE_KEY=${credentials.secondKeyMode}.`,
      }, 500);
    }

    const authToken = credentials.secretToken;
    const baseUrl = INTASEND_ENVIRONMENT === "live"
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1";

    const payload = await req.json();
    const { action, phone_number, amount, business_id, plan_slug, billing_period, invoice_id, payment_id } = payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "initiate") {
      if (!phone_number || !amount || !business_id || !plan_slug) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      const formattedPhone = formatPhoneNumber(phone_number);

      const stkResponse = await fetch(`${baseUrl}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          phone_number: formattedPhone,
          api_ref: `sub_${business_id}_${Date.now()}`,
          narrative: `Abancool ${plan_slug} subscription`,
        }),
      });

      const stkData = await stkResponse.json();

      if (!stkResponse.ok) {
        console.error("IntaSend STK error:", stkData);
        return jsonResponse({ error: "Failed to initiate M-Pesa payment", details: stkData }, 400);
      }

      const { data: payment, error: dbError } = await supabase.from("payments").insert({
        business_id,
        amount: Number(amount),
        phone_number: formattedPhone,
        checkout_request_id: stkData.id || stkData.checkout_request_id,
        invoice_id: stkData.invoice?.invoice_id || stkData.invoice_id || null,
        plan_slug,
        billing_period: billing_period || "monthly",
        status: "pending",
      }).select().single();

      if (dbError) {
        console.error("DB insert error:", dbError);
      }

      return jsonResponse({
        success: true,
        payment_id: payment?.id,
        checkout_request_id: stkData.id || stkData.checkout_request_id,
        invoice_id: stkData.invoice?.invoice_id || stkData.invoice_id,
      });
    }

    if (action === "check_status") {
      if (!invoice_id && !payment_id) {
        return jsonResponse({ error: "invoice_id or payment_id required" }, 400);
      }

      const statusResponse = await fetch(`${baseUrl}/payment/status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ invoice_id }),
      });

      const statusData = await statusResponse.json();

      if (statusData.invoice?.state === "COMPLETE" || statusData.state === "COMPLETE") {
        if (payment_id) {
          await supabase.from("payments").update({
            status: "completed",
            mpesa_receipt: statusData.meta?.receipt_number || statusData.mpesa_receipt || null,
          }).eq("id", payment_id);
        }

        const { data: paymentRecord } = await supabase
          .from("payments")
          .select("business_id, plan_slug, billing_period")
          .eq("id", payment_id)
          .single();

        if (paymentRecord) {
          const daysToAdd = paymentRecord.billing_period === "yearly" ? 365 : 30;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + daysToAdd);

          await supabase.from("businesses").update({
            subscription_plan: paymentRecord.plan_slug,
            subscription_status: "active",
            trial_ends_at: expiryDate.toISOString(),
          }).eq("id", paymentRecord.business_id);

          await supabase.from("audit_logs").insert({
            action: "subscription_payment",
            entity_type: "payment",
            entity_id: payment_id,
            details: { plan: paymentRecord.plan_slug, amount, billing_period: paymentRecord.billing_period },
          });
        }

        return jsonResponse({ status: "completed", data: statusData });
      }

      return jsonResponse({
        status: statusData.invoice?.state?.toLowerCase() || "pending",
        data: statusData,
      });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Edge function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});