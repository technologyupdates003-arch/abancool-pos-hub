
-- Create enum types
CREATE TYPE public.business_type AS ENUM ('retail', 'bar', 'restaurant', 'general');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'suspended', 'cancelled');
CREATE TYPE public.member_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'reserved');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (for super admin)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type business_type NOT NULL DEFAULT 'retail',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  subscription_plan TEXT DEFAULT 'starter',
  subscription_status subscription_status DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business members table
CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role member_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  staff_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status order_status DEFAULT 'pending',
  table_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Restaurant tables
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  status table_status DEFAULT 'available',
  current_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of business
CREATE OR REPLACE FUNCTION public.is_business_member(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE user_id = _user_id AND business_id = _business_id AND is_active = true
  )
$$;

-- Helper: get user's role in business
CREATE OR REPLACE FUNCTION public.get_member_role(_user_id UUID, _business_id UUID)
RETURNS member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.business_members
  WHERE user_id = _user_id AND business_id = _business_id AND is_active = true
  LIMIT 1
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Businesses
CREATE POLICY "Members can view their business" ON public.businesses FOR SELECT USING (public.is_business_member(auth.uid(), id));
CREATE POLICY "Owners can update their business" ON public.businesses FOR UPDATE USING (public.get_member_role(auth.uid(), id) = 'owner');
CREATE POLICY "Authenticated users can create business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all businesses" ON public.businesses FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Business members
CREATE POLICY "Members can view co-members" ON public.business_members FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owners can manage members" ON public.business_members FOR ALL USING (public.get_member_role(auth.uid(), business_id) = 'owner');
CREATE POLICY "Users can insert themselves as owner" ON public.business_members FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- Categories
CREATE POLICY "Members can view categories" ON public.categories FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owners/managers can manage categories" ON public.categories FOR ALL USING (public.get_member_role(auth.uid(), business_id) IN ('owner', 'manager'));

-- Products
CREATE POLICY "Members can view products" ON public.products FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owners/managers can manage products" ON public.products FOR ALL USING (public.get_member_role(auth.uid(), business_id) IN ('owner', 'manager'));

-- Orders
CREATE POLICY "Members can view orders" ON public.orders FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can create orders" ON public.orders FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owners/managers can manage orders" ON public.orders FOR UPDATE USING (public.get_member_role(auth.uid(), business_id) IN ('owner', 'manager'));

-- Order items
CREATE POLICY "Members can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(auth.uid(), o.business_id))
);
CREATE POLICY "Members can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(auth.uid(), o.business_id))
);

-- Restaurant tables
CREATE POLICY "Members can view tables" ON public.restaurant_tables FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owners/managers can manage tables" ON public.restaurant_tables FOR ALL USING (public.get_member_role(auth.uid(), business_id) IN ('owner', 'manager'));

-- Insert super admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'technologyupdates003@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
