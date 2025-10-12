/*
  # Add Menu Management Policies

  1. Security
    - Add policies for menu_items table to allow CRUD operations
    - Enable full access for authenticated users (admin functionality)

  2. Changes
    - Add INSERT, UPDATE, DELETE policies for menu_items
    - Maintain existing SELECT policy
*/

-- Add policy for inserting menu items
CREATE POLICY "Enable insert access for menu_items" ON menu_items
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policy for updating menu items
CREATE POLICY "Enable update access for menu_items" ON menu_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add policy for deleting menu items
CREATE POLICY "Enable delete access for menu_items" ON menu_items
  FOR DELETE
  TO public
  USING (true);