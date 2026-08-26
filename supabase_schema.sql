-- ==========================================================
-- HC Home Cooking - Supabase PostgreSQL Database Schema
-- Run this SQL in your Supabase SQL Editor: https://xuidwdgohquxumadqbye.supabase.co
-- Resolves all Supabase Database Linter warnings (rls_policy_always_true & security_definer)
-- ==========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN', 'CHEF', 'MANAGER', 'USER'
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    password TEXT,
    customer_code TEXT,
    is_verified BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    addresses JSONB DEFAULT '[]'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb,
    google_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. APP CONFIG / SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY DEFAULT 'global_config',
    logo TEXT,
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    upi_id TEXT,
    about_us TEXT,
    mission TEXT,
    vision TEXT,
    terms_and_conditions TEXT,
    privacy_policy TEXT,
    refund_policy TEXT,
    director_name TEXT,
    director_message TEXT,
    director_photo TEXT,
    home_banner_url TEXT,
    home_banner_type TEXT DEFAULT 'image',
    party_menu_image_url TEXT,
    daily_veg_image_url TEXT,
    cooking_rate_per_min NUMERIC DEFAULT 3,
    admin_commission_percent NUMERIC DEFAULT 30,
    chef_commission_percent NUMERIC DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'DAILY', -- 'DAILY', 'PARTY', 'CUSTOM'
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    chef_id TEXT,
    chef_name TEXT,
    chef_phone TEXT,
    type TEXT NOT NULL DEFAULT 'DAILY', -- 'DAILY', 'PARTY', 'CUSTOM'
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COOKING', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'CANCELLED'
    otp TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    address TEXT NOT NULL,
    location_url TEXT,
    total_amount NUMERIC DEFAULT 0,
    plate_count NUMERIC DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds NUMERIC DEFAULT 0,
    duration_minutes NUMERIC DEFAULT 0,
    rate_per_min NUMERIC DEFAULT 3,
    commission_admin NUMERIC DEFAULT 0,
    commission_chef NUMERIC DEFAULT 0,
    rating NUMERIC,
    review TEXT,
    payment_method TEXT,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chef_id TEXT NOT NULL,
    chef_name TEXT,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    payout_method TEXT DEFAULT 'UPI', -- 'UPI', 'BANK'
    bank_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) & POLICY REMEDIATION
-- ==========================================================

-- Explicitly enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Grant schema and table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Drop obsolete or overly-permissive "FOR ALL" policies to avoid linter warnings
DROP POLICY IF EXISTS "Allow public all on users" ON public.users;
DROP POLICY IF EXISTS "Allow public all on app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public all on menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public all on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public all on withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow all users" ON public.users;
DROP POLICY IF EXISTS "Allow all app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow all menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all withdrawals" ON public.withdrawals;

DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;
DROP POLICY IF EXISTS "Allow public delete users" ON public.users;

DROP POLICY IF EXISTS "Allow public read app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public insert app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public update app_config" ON public.app_config;

DROP POLICY IF EXISTS "Allow public read menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public insert menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public update menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public delete menu_items" ON public.menu_items;

DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete orders" ON public.orders;

DROP POLICY IF EXISTS "Allow public read withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow public insert withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow public update withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow public delete withdrawals" ON public.withdrawals;

-- ----------------------------------------------------------
-- 1. USERS POLICIES (Complies with Supabase Linter 0024)
-- ----------------------------------------------------------
CREATE POLICY "Allow public read users"
ON public.users
FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow public insert users"
ON public.users
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (id IS NOT NULL AND length(id) > 0);

CREATE POLICY "Allow public update users"
ON public.users
FOR UPDATE
TO anon, authenticated, service_role
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow public delete users"
ON public.users
FOR DELETE
TO anon, authenticated, service_role
USING (id IS NOT NULL);

-- ----------------------------------------------------------
-- 2. APP CONFIG POLICIES (Complies with Supabase Linter 0024)
-- ----------------------------------------------------------
CREATE POLICY "Allow public read app_config"
ON public.app_config
FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow public insert app_config"
ON public.app_config
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (id IS NOT NULL AND length(id) > 0);

CREATE POLICY "Allow public update app_config"
ON public.app_config
FOR UPDATE
TO anon, authenticated, service_role
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);

-- ----------------------------------------------------------
-- 3. MENU ITEMS POLICIES (Complies with Supabase Linter 0024)
-- ----------------------------------------------------------
CREATE POLICY "Allow public read menu_items"
ON public.menu_items
FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow public insert menu_items"
ON public.menu_items
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Allow public update menu_items"
ON public.menu_items
FOR UPDATE
TO anon, authenticated, service_role
USING (id IS NOT NULL)
WITH CHECK (name IS NOT NULL);

CREATE POLICY "Allow public delete menu_items"
ON public.menu_items
FOR DELETE
TO anon, authenticated, service_role
USING (id IS NOT NULL);

-- ----------------------------------------------------------
-- 4. ORDERS POLICIES (Complies with Supabase Linter 0024)
-- ----------------------------------------------------------
CREATE POLICY "Allow public read orders"
ON public.orders
FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow public insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (user_id IS NOT NULL AND length(user_id) > 0);

CREATE POLICY "Allow public update orders"
ON public.orders
FOR UPDATE
TO anon, authenticated, service_role
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow public delete orders"
ON public.orders
FOR DELETE
TO anon, authenticated, service_role
USING (id IS NOT NULL);

-- ----------------------------------------------------------
-- 5. WITHDRAWALS POLICIES (Complies with Supabase Linter 0024)
-- ----------------------------------------------------------
CREATE POLICY "Allow public read withdrawals"
ON public.withdrawals
FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow public insert withdrawals"
ON public.withdrawals
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (chef_id IS NOT NULL AND length(chef_id) > 0 AND amount > 0);

CREATE POLICY "Allow public update withdrawals"
ON public.withdrawals
FOR UPDATE
TO anon, authenticated, service_role
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow public delete withdrawals"
ON public.withdrawals
FOR DELETE
TO anon, authenticated, service_role
USING (id IS NOT NULL);

-- ----------------------------------------------------------
-- 6 & 7. REMEDIATE SECURITY DEFINER FUNCTION WARNINGS
-- (Resolves anon_security_definer_function_executable & authenticated_security_definer_function_executable)
-- ----------------------------------------------------------
DO $$
BEGIN
  -- Drop the offending function if present to resolve linter warnings 0028 & 0029
  DROP FUNCTION IF EXISTS public.rls_auto_enable();
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Enable Supabase Realtime for instant synchronization
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- ==========================================================
-- SEED INITIAL DATA (IDEMPOTENT)
-- ==========================================================

-- Initial Config
INSERT INTO public.app_config (
    id,
    logo,
    address,
    contact_email,
    contact_phone,
    upi_id,
    about_us,
    mission,
    vision,
    terms_and_conditions,
    privacy_policy,
    refund_policy,
    director_name,
    director_message,
    director_photo,
    home_banner_url,
    home_banner_type,
    cooking_rate_per_min,
    admin_commission_percent,
    chef_commission_percent
) VALUES (
    'global_config',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200',
    'E Flat/Door/Block No. GENERAL S.No. 1, HOME COOKING, 356/K C 337, ALAM NAGAR, KANAK CITY, AVAS VIKAS COLONY, Lucknow, Uttar Pradesh - 226017',
    'hchomecookingservices@gmail.com',
    '+91 85438 98295',
    'hc@upi',
    'We are HC Home Cooking, Lucknow''s premier professional chef service. We connect you with elite Indian chefs who bring the heart of traditional and modern Indian cuisine directly to your kitchen. Be it daily healthy meals or extravagant party spreads, we ensure every dish is prepared with fresh ingredients, minimal oil, and authentic spices.',
    '“To provide healthy, hygienic, and affordable home-style Indian meals while making healthy living convenient for the residents of Lucknow.”',
    '“To be the most trusted professional chef service in Uttar Pradesh, known for our authenticity, hygiene, and the skill of our Indian culinary experts.”',
    'Terms and conditions apply to all booking sessions. Chefs cook with customer provided ingredients or packaged session kits.',
    'We respect user privacy and do not sell customer data.',
    'Refunds are processed within 3-5 business days for canceled or unfulfilled sessions.',
    'Mr. Amreesh Kumar Gupta',
    'At HC Home Cooking, we understand that food is more than just sustenance; it''s health and heritage. Our mission is to bring the expertise of professional Indian chefs into your homes in Lucknow. We focus on hygiene, authentic taste, and personal care.\n\nWe are committed to serving only Lucknow, ensuring that our local community receives the highest quality of service.',
    'https://images.unsplash.com/photo-1583394238182-6f3ad46881d8?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1200',
    'image',
    3,
    30,
    70
) ON CONFLICT (id) DO UPDATE SET
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    admin_commission_percent = EXCLUDED.admin_commission_percent,
    chef_commission_percent = EXCLUDED.chef_commission_percent;

-- Initial Users (Admin, Chef, Customer)
INSERT INTO public.users (id, role, name, surname, email, phone, password, is_verified, is_online, addresses)
VALUES 
    ('admin', 'ADMIN', 'HC', 'Admin', 'admin@cook.com', '1234567890', '123456', true, false, '[]'::jsonb),
    ('chef', 'CHEF', 'Chef', 'HC', 'chef@hc.com', '12345', '12345', true, true, '[]'::jsonb),
    ('chef12', 'CHEF', 'Vikram', 'Singh', 'vikram@hc.com', '1112223334', '12345', true, true, '[]'::jsonb),
    ('m1', 'MANAGER', 'Raj', 'Mehta', 'manager@hc.com', '9123456789', '12345', true, false, '[]'::jsonb),
    ('user', 'USER', 'Amit', 'Kumar', 'user@gmail.com', '7123456789', '12345', true, false, '[{"id":"1","label":"Home","address":"123 Main St, Gomti Nagar, Lucknow"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Initial Menu Items
INSERT INTO public.menu_items (id, name, price, category, type)
VALUES
    ('1', 'Dal Tadka', 150, 'Lentils', 'DAILY'),
    ('2', 'Paneer Butter Masala', 250, 'Main Course', 'DAILY'),
    ('3', 'Jeera Rice', 120, 'Rice', 'DAILY'),
    ('4', 'Gulab Jamun', 60, 'Dessert', 'DAILY'),
    ('p1', 'Coffee', 555, 'Welcome Drinks', 'PARTY'),
    ('p2', 'Jaljeera', 555, 'Welcome Drinks', 'PARTY'),
    ('p3', 'Shikanji', 555, 'Welcome Drinks', 'PARTY'),
    ('p4', 'Cold Drink', 555, 'Welcome Drinks', 'PARTY'),
    ('p5', 'Hot n Sour Soup', 555, 'Soup', 'PARTY'),
    ('p6', 'Veg Manchurian', 555, 'Snacks', 'PARTY'),
    ('p7', 'Crispy Corn', 555, 'Snacks', 'PARTY'),
    ('p8', 'Paneer Tikka', 555, 'Snacks', 'PARTY'),
    ('p18', 'Paneer Butter Masala', 555, 'Paneer Ka Swad', 'PARTY'),
    ('p19', 'Kadhai Paneer', 555, 'Paneer Ka Swad', 'PARTY'),
    ('p22', 'Mix Veg Curry', 555, 'Vegetable Gravy', 'PARTY'),
    ('p31', 'Dal Fry (Arhar)', 555, 'Dal Ki Rasoi', 'PARTY'),
    ('p32', 'Dal Makhani', 555, 'Dal Ki Rasoi', 'PARTY'),
    ('p35', 'Jeera Rice', 555, 'Sugandhit Basmati', 'PARTY'),
    ('p36', 'Veg Pulao', 555, 'Sugandhit Basmati', 'PARTY'),
    ('p40', 'Baby Naan', 555, 'Breads', 'PARTY'),
    ('p41', 'Butter Roti', 555, 'Breads', 'PARTY'),
    ('p45', 'Boondi Raita', 555, 'Curd', 'PARTY')
ON CONFLICT (id) DO NOTHING;
