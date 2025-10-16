/*
  # Update public.users table with role_id
  1. Alter Table: public.users (add role_id uuid)
  2. Foreign Key: Link role_id to roles.id
  3. Default Value: Set default role to 'Staff' for new users.
  4. Security: Update RLS policies for public.users to include role_id.
*/
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_id') THEN
        ALTER TABLE public.users
        ADD COLUMN role_id uuid NULL; -- Allow NULL initially for existing users

        -- Add foreign key constraint
        ALTER TABLE public.users
        ADD CONSTRAINT fk_role
        FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

        -- Set default role for new users to 'Staff'
        -- First, get the ID of the 'Staff' role
        UPDATE public.users
        SET role_id = (SELECT id FROM public.roles WHERE name = 'Staff')
        WHERE role_id IS NULL;

        ALTER TABLE public.users
        ALTER COLUMN role_id SET DEFAULT (SELECT id FROM public.roles WHERE name = 'Staff');

        -- Make role_id NOT NULL after setting default for existing and new users
        ALTER TABLE public.users
        ALTER COLUMN role_id SET NOT NULL;
    END IF;
END
$$;

-- Update RLS policies for public.users to reflect the new role_id column
-- Existing policies might need adjustment, but for now, ensure basic access
-- We will refine RBAC policies in a later step once the UI for role management is ready.
-- For now, ensure authenticated users can still read their own profile.
CREATE OR REPLACE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
