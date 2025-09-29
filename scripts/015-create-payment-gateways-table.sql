-- Create payment gateways configuration table
CREATE TABLE IF NOT EXISTS payment_gateways (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT REFERENCES hotels(id) ON DELETE CASCADE,
    gateway_type VARCHAR(50) NOT NULL, -- 'stripe' or 'paypal'
    is_enabled BOOLEAN DEFAULT false,
    api_key TEXT,
    secret_key TEXT,
    webhook_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, gateway_type)
);

-- Create payment transactions table for tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    hotel_id TEXT REFERENCES hotels(id) ON DELETE CASCADE,
    gateway_type VARCHAR(50) NOT NULL,
    transaction_id TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    gateway_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_gateways_hotel_id ON payment_gateways(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_hotel_id ON payment_transactions(hotel_id);
