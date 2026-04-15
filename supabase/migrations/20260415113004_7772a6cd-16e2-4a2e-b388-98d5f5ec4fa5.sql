
-- Audit logs table for tracking all admin/system actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text, -- 'business', 'user', 'order', 'payment', 'subscription'
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  max_products integer,
  max_staff integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System settings table (key-value store)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  is_read boolean DEFAULT false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_admin_notifications_created ON public.admin_notifications (created_at DESC);

-- Trigger to auto-create notification on new business
CREATE OR REPLACE FUNCTION public.notify_new_business()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Business Registered',
    'Business "' || NEW.name || '" has been registered.',
    'info',
    'business',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_business();

-- Add updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features, max_products, max_staff)
VALUES
  ('Starter', 'starter', 1500, 15000, '["Basic POS", "Up to 50 products", "1 staff account", "Email support"]'::jsonb, 50, 1),
  ('Pro', 'pro', 3500, 35000, '["Full POS", "Unlimited products", "5 staff accounts", "Priority support", "Reports & analytics", "M-Pesa integration"]'::jsonb, NULL, 5),
  ('Enterprise', 'enterprise', 7500, 75000, '["Full POS", "Unlimited products", "Unlimited staff", "24/7 support", "Advanced analytics", "M-Pesa integration", "API access", "Custom branding"]'::jsonb, NULL, NULL);

-- Insert default system settings
INSERT INTO public.system_settings (key, value)
VALUES
  ('platform_name', '"Abancool Technology"'::jsonb),
  ('default_currency', '"KES"'::jsonb),
  ('trial_duration_days', '14'::jsonb),
  ('grace_period_days', '3'::jsonb);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
