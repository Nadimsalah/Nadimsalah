-- Update coupons table constraint to allow 100% percentage discounts
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_discount_value_check;

-- Add new constraint that allows up to 100% for percentage discounts
ALTER TABLE coupons ADD CONSTRAINT coupons_discount_value_check CHECK (
    (discount_type = 'percentage' AND discount_value > 0 AND discount_value <= 100) OR
    (discount_type = 'fixed' AND discount_value > 0)
);

-- Insert 100% free coupon
INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, is_active) VALUES
('FREE100', 'percentage', 100.00, 1000, NOW() + INTERVAL '365 days', true)
ON CONFLICT (code) DO UPDATE SET
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    max_uses = EXCLUDED.max_uses,
    expires_at = EXCLUDED.expires_at,
    is_active = EXCLUDED.is_active;

-- Verify the coupon was created
SELECT code, discount_type, discount_value, max_uses, expires_at, is_active 
FROM coupons 
WHERE code = 'FREE100';
