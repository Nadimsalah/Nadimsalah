-- Create subscriptions table for Whop payments
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  receipt_id VARCHAR(255) UNIQUE NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_id VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active',
  subscription_type VARCHAR(50),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_receipt ON subscriptions(receipt_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
