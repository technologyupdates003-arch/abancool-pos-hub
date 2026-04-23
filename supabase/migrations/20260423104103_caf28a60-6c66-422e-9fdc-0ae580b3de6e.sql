-- Per-business M-Pesa Daraja credentials
CREATE TABLE public.business_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  mpesa_consumer_key text,
  mpesa_consumer_secret text,
  mpesa_shortcode text,
  mpesa_passkey text,
  mpesa_environment text NOT NULL DEFAULT 'sandbox',
  mpesa_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners/managers can view payment settings"
ON public.business_payment_settings FOR SELECT
USING (get_member_role(auth.uid(), business_id) = ANY (ARRAY['owner'::member_role, 'manager'::member_role]));

CREATE POLICY "Owners/managers can insert payment settings"
ON public.business_payment_settings FOR INSERT
WITH CHECK (get_member_role(auth.uid(), business_id) = ANY (ARRAY['owner'::member_role, 'manager'::member_role]));

CREATE POLICY "Owners/managers can update payment settings"
ON public.business_payment_settings FOR UPDATE
USING (get_member_role(auth.uid(), business_id) = ANY (ARRAY['owner'::member_role, 'manager'::member_role]));

CREATE POLICY "Admins can view all payment settings"
ON public.business_payment_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_payment_settings_updated_at
BEFORE UPDATE ON public.business_payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track STK request id on orders for sale-time M-Pesa
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mpesa_request_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mpesa_receipt text;