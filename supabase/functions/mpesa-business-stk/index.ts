// Per-business M-Pesa Daraja STK push using business-owned credentials
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const formatPhone = (p: string) =>
  p.replace(/\s+/g, "").replace(/^\+/, "").replace(/^0/, "254");

const baseUrlFor = (env: string) =>
  env === "production" || env === "live" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

const tsNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const b64 = (s: string) => btoa(s);

async function getAccessToken(baseUrl: string, key: string, secret: string) {
  const auth = b64(`${key}:${secret}`);
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload = await req.json();
    const { action, business_id } = payload;

    if (!business_id) return json({ error: "business_id required" }, 400);

    const { data: settings, error: sErr } = await supabase
      .from("business_payment_settings")
      .select("*")
      .eq("business_id", business_id)
      .maybeSingle();

    if (sErr || !settings) {
      return json({ error: "M-Pesa not configured for this business. Ask the owner to add credentials in Settings." }, 400);
    }
    if (!settings.mpesa_enabled) {
      return json({ error: "M-Pesa is disabled for this business." }, 400);
    }
    const { mpesa_consumer_key, mpesa_consumer_secret, mpesa_shortcode, mpesa_passkey, mpesa_environment } = settings;
    if (!mpesa_consumer_key || !mpesa_consumer_secret || !mpesa_shortcode || !mpesa_passkey) {
      return json({ error: "Missing M-Pesa credentials. Complete setup in Settings." }, 400);
    }

    const baseUrl = baseUrlFor(mpesa_environment || "sandbox");
    const token = await getAccessToken(baseUrl, mpesa_consumer_key, mpesa_consumer_secret);

    if (action === "initiate") {
      const { phone_number, amount, reference } = payload;
      if (!phone_number || !amount) return json({ error: "phone_number and amount required" }, 400);

      const timestamp = tsNow();
      const password = b64(`${mpesa_shortcode}${mpesa_passkey}${timestamp}`);
      const phone = formatPhone(phone_number);

      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          BusinessShortCode: mpesa_shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(Number(amount)),
          PartyA: phone,
          PartyB: mpesa_shortcode,
          PhoneNumber: phone,
          CallBackURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-business-stk`,
          AccountReference: (reference || "POS").slice(0, 12),
          TransactionDesc: "POS Sale",
        }),
      });

      const stkData = await stkRes.json();
      if (!stkRes.ok || stkData.errorCode) {
        console.error("Daraja STK error:", stkData);
        return json({ error: stkData.errorMessage || "STK push failed", details: stkData }, 400);
      }

      return json({
        success: true,
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
      });
    }

    if (action === "check_status") {
      const { checkout_request_id } = payload;
      if (!checkout_request_id) return json({ error: "checkout_request_id required" }, 400);

      const timestamp = tsNow();
      const password = b64(`${mpesa_shortcode}${mpesa_passkey}${timestamp}`);

      const qRes = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          BusinessShortCode: mpesa_shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkout_request_id,
        }),
      });

      const qData = await qRes.json();

      // ResultCode "0" = success
      if (qData.ResultCode === "0" || qData.ResultCode === 0) {
        return json({ status: "completed", mpesa_receipt: qData.MpesaReceiptNumber || null, data: qData });
      }
      // 1032 = cancelled, 1037 = timeout, 1 = insufficient funds, 2001 = wrong PIN
      if (["1", "1032", "1037", "2001"].includes(String(qData.ResultCode))) {
        return json({ status: "failed", message: qData.ResultDesc, data: qData });
      }
      // 1037/1036 still pending sometimes
      return json({ status: "pending", data: qData });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("mpesa-business-stk error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
