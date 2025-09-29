-- Add missing columns to hotels table for complete settings functionality

ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'MAD',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 8.5,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS minimum_order DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(100) DEFAULT '24/7',
ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_qr_ordering BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_room_delivery BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_new_orders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_low_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_daily_reports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_promotions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_system_updates BOOLEAN DEFAULT false;

-- Update existing hotels with default values
UPDATE hotels 
SET 
  primary_color = COALESCE(primary_color, '#000000'),
  currency = COALESCE(currency, 'MAD'),
  tax_rate = COALESCE(tax_rate, 8.5),
  delivery_fee = COALESCE(delivery_fee, 5.00),
  minimum_order = COALESCE(minimum_order, 15.00),
  operating_hours = COALESCE(operating_hours, '24/7'),
  enable_notifications = COALESCE(enable_notifications, true),
  enable_qr_ordering = COALESCE(enable_qr_ordering, true),
  enable_room_delivery = COALESCE(enable_room_delivery, true),
  notification_new_orders = COALESCE(notification_new_orders, true),
  notification_low_stock = COALESCE(notification_low_stock, true),
  notification_daily_reports = COALESCE(notification_daily_reports, false),
  notification_promotions = COALESCE(notification_promotions, true),
  notification_system_updates = COALESCE(notification_system_updates, false)
WHERE 
  primary_color IS NULL OR
  currency IS NULL OR
  tax_rate IS NULL OR
  delivery_fee IS NULL OR
  minimum_order IS NULL OR
  operating_hours IS NULL OR
  enable_notifications IS NULL OR
  enable_qr_ordering IS NULL OR
  enable_room_delivery IS NULL OR
  notification_new_orders IS NULL OR
  notification_low_stock IS NULL OR
  notification_daily_reports IS NULL OR
  notification_promotions IS NULL OR
  notification_system_updates IS NULL;
