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

const keysMatchEnvironment = (secretKey: string, publishableKey: string, environment: string) => {
  const expectedKeyword = environment === "live" ? "live" : "test";
  return secretKey.includes(expectedKeyword) && publishableKey.includes(expectedKeyword);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const INTASEND_API_KEY = Deno.env.get("INTASEND_API_KEY");
    const INTASEND_PUBLISHABLE_KEY = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    const INTASEND_ENVIRONMENT = Deno.env.get("INTASEND_ENVIRONMENT") === "live" ? "live" : "sandbox";

    if (!INTASEND_API_KEY || !INTASEND_PUBLISHABLE_KEY) {
      return jsonResponse({ error: "IntaSend keys not configured" }, 500);
    }

    if (!keysMatchEnvironment(INTASEND_API_KEY, INTASEND_PUBLISHABLE_KEY, INTASEND_ENVIRONMENT)) {
      return jsonResponse({
        error: `IntaSend ${INTASEND_ENVIRONMENT} configuration mismatch`,
        details: `Use test keys for sandbox and live keys for live environment.`,
      }, 500);
    }

    const baseUrl = INTASEND_ENVIRONMENT === "live"
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1";

    const payload = await req.json();
    const { action, phone_number, amount, business_id, plan_slug, billing_period, invoice_id, payment_id } = payload;

    // Create Supabase client with service role for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "initiate") {
      // Validate inputs
      if (!phone_number || !amount || !business_id || !plan_slug) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      // Format phone number for IntaSend (254XXXXXXXXX)
      const formattedPhone = formatPhoneNumber(phone_number);

      // Initiate STK Push via IntaSend
      const stkResponse = await fetch(`${baseUrl}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${INTASEND_API_KEY}`,
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

      // Save payment record
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

      // Check payment status from IntaSend
      let checkUrl = `${baseUrl}/payment/status/`;
      const statusResponse = await fetch(checkUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${INTASEND_API_KEY}`,
        },
        body: JSON.stringify({ invoice_id }),
      });

      const statusData = await statusResponse.json();

      if (statusData.invoice?.state === "COMPLETE" || statusData.state === "COMPLETE") {
        // Update payment record
        if (payment_id) {
          await supabase.from("payments").update({
            status: "completed",
            mpesa_receipt: statusData.meta?.receipt_number || statusData.mpesa_receipt || null,
          }).eq("id", payment_id);
        }

        // Update business subscription
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

          // Audit log
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
    return jsonResponse({ error: err.message }, 500);
  }
});
