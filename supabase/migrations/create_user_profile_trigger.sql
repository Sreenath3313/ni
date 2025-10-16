/*
  # Create trigger for public.users profile creation
  1. New Function: create_public_user_on_signup()
     - Automatically inserts a new row into public.users when a new user signs up in auth.users.
     - Sets default role to 'staff'.
  2. New Trigger: on_auth_user_created
     - Attaches the function to the auth.users table.
*/

-- 1. Create the function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.create_public_user_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to bypass RLS for its internal operations
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'staff'); -- Default role for new sign-ups
  RETURN NEW;
END;
$$;

-- 2. Create the trigger that fires after a new user is inserted into auth.users
-- Drop existing trigger if it somehow exists to prevent duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_public_user_on_signup();
