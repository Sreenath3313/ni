/*
  # Create roles and categories tables
  1. New Tables:
     - roles (id uuid, name text)
     - categories (id uuid, name text)
  2. Security: Enable RLS for both tables, add read policies for authenticated users.
*/
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read roles" ON roles FOR SELECT TO authenticated USING (true);

INSERT INTO roles (name) VALUES
('Admin'),
('Manager'),
('Staff')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read categories" ON categories FOR SELECT TO authenticated USING (true);

INSERT INTO categories (name) VALUES
('Routers'),
('Switches'),
('Cables'),
('Antennas'),
('Modems'),
('Optical Fiber')
ON CONFLICT (name) DO NOTHING;
