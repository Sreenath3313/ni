/*
  # Fix RLS Infinite Recursion for Users Table
  1. New Functions: is_admin(), is_manager(), is_staff_or_higher() to safely check user roles.
  2. Policy Updates:
     - Drop all existing RLS policies for all tables.
     - Re-create RLS policies for all tables using the new helper functions for role-based checks.
     - Crucially, the INSERT policy for public.users now allows a user to create their own profile based on auth.uid() without recursive role checks.
*/

-- Drop existing RLS policies to avoid conflicts and prepare for new ones
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can create new users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user profile" ON public.users;

DROP POLICY IF EXISTS "Admins and Managers can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Staff can view suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Admins and Managers can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff can view products" ON public.products;

DROP POLICY IF EXISTS "Admins and Managers can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;

DROP POLICY IF EXISTS "Admins and Managers can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;

DROP POLICY IF EXISTS "Admins and Managers can manage inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Staff can view inventory transactions" ON public.inventory_transactions;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications for any user" ON public.notifications;


-- 1. Create Helper Functions for Role Checks (SECURITY DEFINER to bypass RLS for internal query)
----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff'));
END;
$$;


-- 2. Re-create RLS Policies for public.users
----------------------------------------------------------------------------------------------------

-- Allow a user to create their own profile entry after Supabase auth signup
CREATE POLICY "Allow individual user to create their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (public.is_admin());

-- Admins can update any user profile
CREATE POLICY "Admins can update any profile" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Admins can delete any user profile
CREATE POLICY "Admins can delete any profile" ON public.users
  FOR DELETE USING (public.is_admin());


-- 3. Re-create RLS Policies for public.suppliers
----------------------------------------------------------------------------------------------------

CREATE POLICY "Admins and Managers can manage suppliers" ON public.suppliers
  FOR ALL USING (public.is_admin() OR public.is_manager());

CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT USING (public.is_staff_or_higher());


-- 4. Re-create RLS Policies for public.products
----------------------------------------------------------------------------------------------------

CREATE POLICY "Admins and Managers can manage products" ON public.products
  FOR ALL USING (public.is_admin() OR public.is_manager());

CREATE POLICY "Staff can view products" ON public.products
  FOR SELECT USING (public.is_staff_or_higher());


-- 5. Re-create RLS Policies for public.orders
----------------------------------------------------------------------------------------------------

CREATE POLICY "Admins and Managers can manage orders" ON public.orders
  FOR ALL USING (public.is_admin() OR public.is_manager());

CREATE POLICY "Staff can view orders" ON public.orders
  FOR SELECT USING (public.is_staff_or_higher());


-- 6. Re-create RLS Policies for public.order_items
----------------------------------------------------------------------------------------------------

CREATE POLICY "Admins and Managers can manage order items" ON public.order_items
  FOR ALL USING (public.is_admin() OR public.is_manager());

CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT USING (public.is_staff_or_higher());


-- 7. Re-create RLS Policies for public.inventory_transactions
----------------------------------------------------------------------------------------------------

CREATE POLICY "Admins and Managers can manage inventory transactions" ON public.inventory_transactions
  FOR ALL USING (public.is_admin() OR public.is_manager());

CREATE POLICY "Staff can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (public.is_staff_or_higher());


-- 8. Re-create RLS Policies for public.notifications
----------------------------------------------------------------------------------------------------

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());
