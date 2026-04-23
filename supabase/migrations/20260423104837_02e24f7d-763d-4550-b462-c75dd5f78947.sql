-- Suppliers per business
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view suppliers"
ON public.suppliers FOR SELECT
USING (is_business_member(auth.uid(), business_id));

CREATE POLICY "Owners/managers can manage suppliers"
ON public.suppliers FOR ALL
USING (get_member_role(auth.uid(), business_id) = ANY (ARRAY['owner'::member_role, 'manager'::member_role]));

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_suppliers_business ON public.suppliers(business_id);

-- Optional supplier link on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id uuid;

-- Stock movements (audit trail for inventory)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  product_id uuid NOT NULL,
  supplier_id uuid,
  movement_type text NOT NULL CHECK (movement_type IN ('purchase','sale','adjustment','return','waste')),
  quantity integer NOT NULL,
  unit_cost numeric DEFAULT 0,
  reference text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view stock movements"
ON public.stock_movements FOR SELECT
USING (is_business_member(auth.uid(), business_id));

CREATE POLICY "Members can insert stock movements"
ON public.stock_movements FOR INSERT
WITH CHECK (is_business_member(auth.uid(), business_id));

CREATE POLICY "Owners/managers can update stock movements"
ON public.stock_movements FOR UPDATE
USING (get_member_role(auth.uid(), business_id) = ANY (ARRAY['owner'::member_role, 'manager'::member_role]));

CREATE INDEX idx_stock_movements_business_created ON public.stock_movements(business_id, created_at DESC);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);