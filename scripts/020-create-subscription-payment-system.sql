-- Create subscription and payment system tables
-- This script creates the database schema for managing user subscriptions and payments

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'one-time'
    duration_months INTEGER NOT NULL, -- 0 for trial, 6 for 6-month, 12 for 12-month
    max_products INTEGER DEFAULT 5, -- product limit for each plan
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'trial'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(50), -- 'stripe', 'paypal', 'free'
    stripe_subscription_id TEXT,
    paypal_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subscription_id TEXT NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id TEXT,
    gateway_response JSONB,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, duration_months, max_products, features) VALUES
('Free Trial', '14-day free trial with 5 products', 0.00, 'one-time', 0, 5, '["Basic Support", "5 Products", "QR Code Generation", "Basic Analytics"]'::jsonb),
('6-Month Pack', '6-month subscription with unlimited products', 299.00, 'one-time', 6, -1, '["Priority Support", "Unlimited Products", "Advanced Analytics", "Custom Branding", "Stories Feature"]'::jsonb),
('12-Month Pack', '12-month subscription with unlimited products and premium features', 499.00, 'one-time', 12, -1, '["Premium Support", "Unlimited Products", "Advanced Analytics", "Custom Branding", "Stories Feature", "Priority Processing", "API Access"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);

-- Add subscription tracking to users table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_subscription_id') THEN
        ALTER TABLE users ADD COLUMN current_subscription_id TEXT REFERENCES user_subscriptions(id);
    END IF;
END $$;

-- Create function to automatically set trial subscription for new users
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
    trial_plan_id TEXT;
    new_subscription_id TEXT;
BEGIN
    -- Get the free trial plan ID
    SELECT id INTO trial_plan_id FROM subscription_plans WHERE name = 'Free Trial' LIMIT 1;
    
    IF trial_plan_id IS NOT NULL THEN
        -- Create trial subscription
        INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, payment_method)
        VALUES (NEW.id, trial_plan_id, 'trial', NOW(), NOW() + INTERVAL '14 days', 'free')
        RETURNING id INTO new_subscription_id;
        
        -- Update user's current subscription
        UPDATE users SET current_subscription_id = new_subscription_id WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create trial subscription for new users
DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON users;
CREATE TRIGGER trigger_create_trial_subscription
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_trial_subscription();

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(user_id_param TEXT)
RETURNS TABLE (
    is_active BOOLEAN,
    plan_name VARCHAR(100),
    end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    max_products INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (us.status = 'active' OR us.status = 'trial') AND us.end_date > NOW() as is_active,
        sp.name as plan_name,
        us.end_date,
        EXTRACT(DAY FROM us.end_date - NOW())::INTEGER as days_remaining,
        sp.max_products
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_id_param
    AND us.status IN ('active', 'trial')
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans with pricing and features';
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription status and billing information';
COMMENT ON TABLE subscription_payments IS 'Records all payment transactions for subscriptions';
