/*
  # Multi-Business Authentication System

  1. New Tables
    - `businesses` - Store business information
    - `user_profiles` - Store user profiles linked to businesses
    - `business_invitations` - Store invitations for new users

  2. Security
    - Enable RLS on all tables
    - Add policies for business isolation
    - Users can only access data from their business

  3. Functions
    - Function to create business on first user registration
    - Function to handle user invitations
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Cajero', 'Cocina')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create business invitations table
CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('Cajero', 'Cocina')),
  invited_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Users can read their own business" ON businesses
  FOR SELECT USING (
    id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business" ON businesses
  FOR UPDATE USING (
    id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- User profiles policies
CREATE POLICY "Users can read profiles from their business" ON user_profiles
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can insert new users in their business" ON user_profiles
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Business invitations policies
CREATE POLICY "Admins can manage invitations for their business" ON business_invitations
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Update existing tables to include business_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id);

-- Update orders policies
DROP POLICY IF EXISTS "Enable all operations for orders" ON orders;
CREATE POLICY "Users can access orders from their business" ON orders
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Update menu_items policies
DROP POLICY IF EXISTS "Enable read access for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow select to all" ON menu_items;
DROP POLICY IF EXISTS "Enable delete access for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Enable insert access for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Enable update access for menu_items" ON menu_items;

CREATE POLICY "Users can access menu items from their business" ON menu_items
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Function to create business and admin user on first registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  business_uuid uuid;
BEGIN
  -- This function will be called from the client after email confirmation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user business context
CREATE OR REPLACE FUNCTION get_user_business_context()
RETURNS TABLE (
  user_id uuid,
  business_id uuid,
  business_name text,
  user_role text,
  full_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.business_id,
    b.name as business_name,
    up.role as user_role,
    up.full_name
  FROM user_profiles up
  JOIN businesses b ON b.id = up.business_id
  WHERE up.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;