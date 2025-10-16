/*
  # Refine RBAC Policies with Security Definer Functions
  1. Create SECURITY DEFINER functions for role checks (is_admin, is_manager, is_staff_or_higher).
  2. Update RLS policies for all public tables to use these new role-based functions.
  3. Ensure policies align with the following access rules:
     - Admins: Full CRUD on all tables.
     - Managers: Full CRUD on suppliers, products, orders, order_items, inventory_transactions. Read-only on users (except own profile).
     - Staff: Read-only on suppliers, products, orders, order_items, inventory_transactions. Read/Update own users profile and notifications.
*/

-- Set search path to public to avoid needing to prefix public.
SET search_path = public;

-- 1. Create SECURITY DEFINER functions for role checks
-- These functions run with the privileges of the user who created them (typically the database owner),
-- allowing them to bypass RLS on the 'users' table when checking roles, thus preventing infinite recursion.

-- Function to check if the current user is an 'Admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'Admin'
  );
END;
$$;

-- Function to check if the current user is a 'Manager'
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'Manager'
  );
END;
$$;

-- Function to check if the current user is 'Staff' or higher (Admin, Manager, Staff)
CREATE OR REPLACE FUNCTION is_staff_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name IN ('Admin', 'Manager', 'Staff')
  );
END;
$$;

-- Function to check if the current user is 'Manager' or higher (Admin, Manager)
CREATE OR REPLACE FUNCTION is_manager_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name IN ('Admin', 'Manager')
  );
END;
$$;


-- 2. Update RLS Policies for all public tables

-- public.users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can create new users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user profile" ON public.users;

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (is_admin());

CREATE POLICY "Managers can view all users" ON public.users
  FOR SELECT USING (is_manager());

CREATE POLICY "Users can view and update their own profile" ON public.users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- public.suppliers table policies
DROP POLICY IF EXISTS "Admins and Managers can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Staff can view suppliers" ON public.suppliers;

CREATE POLICY "Admins and Managers can manage suppliers" ON public.suppliers
  FOR ALL USING (is_manager_or_higher());

CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT USING (is_staff_or_higher());


-- public.products table policies
DROP POLICY IF EXISTS "Admins and Managers can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff can view products" ON public.products;

CREATE POLICY "Admins and Managers can manage products" ON public.products
  FOR ALL USING (is_manager_or_higher());

CREATE POLICY "Staff can view products" ON public.products
  FOR SELECT USING (is_staff_or_higher());


-- public.orders table policies
DROP POLICY IF EXISTS "Admins and Managers can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;

CREATE POLICY "Admins and Managers can manage orders" ON public.orders
  FOR ALL USING (is_manager_or_higher());

CREATE POLICY "Staff can view orders" ON public.orders
  FOR SELECT USING (is_staff_or_higher());


-- public.order_items table policies
DROP POLICY IF EXISTS "Admins and Managers can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;

CREATE POLICY "Admins and Managers can manage order items" ON public.order_items
  FOR ALL USING (is_manager_or_higher());

CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT USING (is_staff_or_higher());


-- public.inventory_transactions table policies
DROP POLICY IF EXISTS "Admins and Managers can manage inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Staff can view inventory transactions" ON public.inventory_transactions;

CREATE POLICY "Admins and Managers can manage inventory transactions" ON public.inventory_transactions
  FOR ALL USING (is_manager_or_higher());

CREATE POLICY "Staff can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (is_staff_or_higher());


-- public.notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications for any user" ON public.notifications;

CREATE POLICY "Users can view and update their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user" ON public.notifications
  FOR INSERT WITH CHECK (is_admin());

-- Re-enable RLS for roles and categories tables (if they were disabled or policies were dropped)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Allow authenticated users to read roles" ON public.roles FOR SELECT TO authenticated USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Allow authenticated users to read categories" ON public.categories FOR SELECT TO authenticated USING (true);
