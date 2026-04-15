import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const INTASEND_API_KEY = Deno.env.get("INTASEND_API_KEY");
    const INTASEND_PUBLISHABLE_KEY = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    const INTASEND_ENVIRONMENT = Deno.env.get("INTASEND_ENVIRONMENT") || "sandbox";

    if (!INTASEND_API_KEY || !INTASEND_PUBLISHABLE_KEY) {
      return new Response(JSON.stringify({ error: "IntaSend keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = INTASEND_ENVIRONMENT === "live"
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1";

    const { action, phone_number, amount, business_id, plan_slug, billing_period, invoice_id } = await req.json();

    // Create Supabase client with service role for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "initiate") {
      // Validate inputs
      if (!phone_number || !amount || !business_id || !plan_slug) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Format phone number for IntaSend (254XXXXXXXXX)
      let formattedPhone = phone_number.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");

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
        return new Response(JSON.stringify({ error: "Failed to initiate M-Pesa payment", details: stkData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      return new Response(JSON.stringify({
        success: true,
        payment_id: payment?.id,
        checkout_request_id: stkData.id || stkData.checkout_request_id,
        invoice_id: stkData.invoice?.invoice_id || stkData.invoice_id,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      const { payment_id } = await req.json().catch(() => ({ payment_id: null }));

      if (!invoice_id && !payment_id) {
        return new Response(JSON.stringify({ error: "invoice_id or payment_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

        return new Response(JSON.stringify({ status: "completed", data: statusData }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        status: statusData.invoice?.state?.toLowerCase() || "pending",
        data: statusData,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
