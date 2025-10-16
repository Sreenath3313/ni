--
-- Telecom Inventory Management System (TIMS) Database Schema
--
-- This SQL script defines the tables, relationships, and initial Row Level Security (RLS)
-- policies for your Supabase project.
--
-- CRITICAL: Run this script in your Supabase SQL Editor.
-- Remember to connect to Supabase in the chat box before proceeding.
--

-- The line 'ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;' has been removed
-- as the 'auth.users' table is managed by Supabase and direct alteration of its RLS
-- by a user can cause permission errors. RLS for 'auth.users' is handled internally.

-- 1. Users Table
-- Stores user authentication details and roles for access control.
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'staff' NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all user profiles" ON public.users
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create new users" ON public.users
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update any user profile" ON public.users
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete any user profile" ON public.users
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 2. Suppliers Table
-- Manages information about product suppliers.
CREATE TABLE public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    delivery_terms TEXT,
    performance_rating NUMERIC(3, 2) DEFAULT 0.00, -- e.g., 0.00 to 5.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage suppliers" ON public.suppliers
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')));

CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')));

-- 3. Products Table
-- Stores details about inventory items.
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity INT DEFAULT 0 NOT NULL CHECK (quantity >= 0),
    reorder_level INT DEFAULT 10 NOT NULL CHECK (reorder_level >= 0),
    unit_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (unit_price >= 0),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage products" ON public.products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')));

CREATE POLICY "Staff can view products" ON public.products
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')));

-- 4. Orders Table
-- Tracks purchase orders for inventory replenishment.
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
    total_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (total_price >= 0),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage orders" ON public.orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')));

CREATE POLICY "Staff can view orders" ON public.orders
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')));

-- 5. Order Items Table (Junction table for Orders and Products)
-- Details individual products within an order.
CREATE TABLE public.order_items (
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    PRIMARY KEY (order_id, product_id)
);

-- Set up RLS for order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage order items" ON public.order_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')));

CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')));

-- 6. Inventory Transactions Table
-- Logs all movements and adjustments of inventory.
CREATE TABLE public.inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'return')),
    quantity_change INT NOT NULL,
    current_quantity_snapshot INT NOT NULL, -- Quantity of product AFTER this transaction
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Optional: link to an order
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for inventory_transactions table
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage inventory transactions" ON public.inventory_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')));

CREATE POLICY "Staff can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')));

-- 7. Notifications Table
-- Stores system alerts and user-specific notifications.
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('low_stock', 'delayed_order', 'system_alert', 'info')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user" ON public.notifications
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

--
-- Database Functions and Triggers (Optional, for advanced automation)
--
-- Example: Function to update product quantity on order delivery
-- This would be triggered when an order's status changes to 'delivered'.
--
-- CREATE OR REPLACE FUNCTION public.update_product_quantity_on_delivery()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
--     UPDATE public.products
--     SET quantity = quantity + oi.quantity
--     FROM public.order_items oi
--     WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_product_quantity_trigger
-- AFTER UPDATE OF status ON public.orders
-- FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity_on_delivery();
--

-- Example: Function to create a notification for low stock
-- This would be triggered after an inventory_transaction that reduces stock.
--
-- CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   product_reorder_level INT;
--   product_name TEXT;
-- BEGIN
--   SELECT reorder_level, name INTO product_reorder_level, product_name
--   FROM public.products
--   WHERE id = NEW.product_id;
--
--   IF NEW.current_quantity_snapshot <= product_reorder_level THEN
--     INSERT INTO public.notifications (user_id, type, message)
--     SELECT id, 'low_stock', 'Product "' || product_name || '" is low in stock (' || NEW.current_quantity_snapshot || '). Reorder level is ' || product_reorder_level || '.'
--     FROM public.users
--     WHERE role IN ('admin', 'manager'); -- Notify admins and managers
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER check_low_stock_trigger
-- AFTER INSERT OR UPDATE ON public.inventory_transactions
-- FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_and_notify();
--

-- Initial data for roles (optional, can be managed via UI)
-- INSERT INTO public.users (id, email, role, first_name, last_name) VALUES
-- ('<SUPABASE_AUTH_USER_ID_1>', 'admin@example.com', 'admin', 'System', 'Admin'),
-- ('<SUPABASE_AUTH_USER_ID_2>', 'manager@example.com', 'manager', 'Jane', 'Doe'),
-- ('<SUPABASE_AUTH_USER_ID_3>', 'staff@example.com', 'staff', 'John', 'Smith');
