/*
  # Add order duration tracking

  1. Changes
    - Add `duration_minutes` column to orders table to store completion time
    - Add function to calculate duration when order is completed
    - Update existing orders to have duration calculated from created_at and delivered_at

  2. Security
    - No changes to existing RLS policies
*/

-- Add duration column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE orders ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- Create function to calculate and update order duration
CREATE OR REPLACE FUNCTION update_order_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate duration when order is marked as delivered
  IF NEW.status = 'Entregada' AND OLD.status != 'Entregada' THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.delivered_at - NEW.created_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate duration
DROP TRIGGER IF EXISTS calculate_order_duration ON orders;
CREATE TRIGGER calculate_order_duration
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_duration();

-- Update existing completed orders with calculated duration
UPDATE orders 
SET duration_minutes = EXTRACT(EPOCH FROM (delivered_at - created_at)) / 60
WHERE status = 'Entregada' 
  AND delivered_at IS NOT NULL 
  AND duration_minutes IS NULL;