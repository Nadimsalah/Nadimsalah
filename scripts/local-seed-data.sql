-- Local Development Seed Data
-- Run this after local-setup.sql to populate with test data

-- Insert test subscription plans
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, duration_months, max_products, features, is_active) VALUES
('plan_basic', 'Basic Plan', 'Perfect for small hotels', 29.99, 'monthly', 1, 50, '{"analytics": false, "custom_branding": false, "priority_support": false}', true),
('plan_pro', 'Pro Plan', 'Great for growing businesses', 79.99, 'monthly', 1, 200, '{"analytics": true, "custom_branding": true, "priority_support": false}', true),
('plan_enterprise', 'Enterprise Plan', 'For large hotel chains', 199.99, 'monthly', 1, 1000, '{"analytics": true, "custom_branding": true, "priority_support": true}', true);

-- Insert test users
INSERT INTO users (id, first_name, last_name, email, password, role, hotel_name, current_subscription_id) VALUES
('user_admin', 'Admin', 'User', 'admin@hoteltec.com', '$2b$10$rQZ9QmjytWIeJH2vKt.nKuQZ9QmjytWIeJH2vKt.nKu', 'super_admin', 'HotelTec Admin', 'plan_enterprise'),
('user_hotel1', 'John', 'Doe', 'john@grandhotel.com', '$2b$10$rQZ9QmjytWIeJH2vKt.nKuQZ9QmjytWIeJH2vKt.nKu', 'hotel_owner', 'Grand Hotel', 'plan_pro'),
('user_hotel2', 'Jane', 'Smith', 'jane@oceanview.com', '$2b$10$rQZ9QmjytWIeJH2vKt.nKuQZ9QmjytWIeJH2vKt.nKu', 'hotel_owner', 'Ocean View Resort', 'plan_basic');

-- Insert test hotels
INSERT INTO hotels (id, name, slug, description, address, city, country, contact_number, owner_number, currency, logo_url, store_color, owner_id) VALUES
('hotel_grand', 'Grand Hotel', 'grand-hotel', 'Luxury hotel in the heart of the city', '123 Main Street', 'New York', 'USA', '+1-555-0123', '+1-555-0124', 'USD', '/placeholder.svg?height=100&width=100', '#1E40AF', 'user_hotel1'),
('hotel_ocean', 'Ocean View Resort', 'ocean-view-resort', 'Beautiful beachfront resort', '456 Beach Road', 'Miami', 'USA', '+1-555-0456', '+1-555-0457', 'USD', '/placeholder.svg?height=100&width=100', '#059669', 'user_hotel2');

-- Insert test products
INSERT INTO products (id, hotel_id, name, description, price, category, image_url, in_stock, rating) VALUES
('prod_1', 'hotel_grand', 'Room Service Breakfast', 'Continental breakfast delivered to your room', 25.99, 'Food & Beverage', '/placeholder.svg?height=200&width=200', true, 4.5),
('prod_2', 'hotel_grand', 'Spa Treatment', 'Relaxing full body massage', 89.99, 'Spa & Wellness', '/placeholder.svg?height=200&width=200', true, 4.8),
('prod_3', 'hotel_ocean', 'Beach Umbrella Rental', 'Premium beach umbrella for the day', 15.99, 'Beach Services', '/placeholder.svg?height=200&width=200', true, 4.2),
('prod_4', 'hotel_ocean', 'Sunset Dinner', 'Romantic dinner with ocean view', 75.99, 'Food & Beverage', '/placeholder.svg?height=200&width=200', true, 4.9);

-- Insert test orders
INSERT INTO orders (id, hotel_id, guest_name, room_number, phone_number, items, total_amount, status, payment_method) VALUES
('order_1', 'hotel_grand', 'Alice Johnson', '101', '+1-555-1111', '[{"id": "prod_1", "name": "Room Service Breakfast", "price": 25.99, "quantity": 2}]', 51.98, 'completed', 'credit_card'),
('order_2', 'hotel_ocean', 'Bob Wilson', '205', '+1-555-2222', '[{"id": "prod_3", "name": "Beach Umbrella Rental", "price": 15.99, "quantity": 1}]', 15.99, 'pending', 'cash');

-- Insert test support tickets
INSERT INTO support_tickets (id, user_id, hotel_id, subject, description, status, priority) VALUES
('ticket_1', 'user_hotel1', 'hotel_grand', 'WiFi Issues in Room 101', 'Guest is experiencing slow internet connection', 'open', 'high'),
('ticket_2', 'user_hotel2', 'hotel_ocean', 'Payment Gateway Setup', 'Need help configuring Stripe payment gateway', 'in_progress', 'medium');

-- Insert test ticket comments
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, is_admin_response) VALUES
('comment_1', 'ticket_1', 'user_hotel1', 'Guest called front desk about this issue', false),
('comment_2', 'ticket_1', 'user_admin', 'We are looking into the network infrastructure. Will update soon.', true),
('comment_3', 'ticket_2', 'user_hotel2', 'I have the API keys ready', false);

-- Insert test user subscriptions
INSERT INTO user_subscriptions (id, user_id, plan_id, status, start_date, end_date) VALUES
('sub_1', 'user_hotel1', 'plan_pro', 'active', NOW(), NOW() + INTERVAL '1 month'),
('sub_2', 'user_hotel2', 'plan_basic', 'active', NOW(), NOW() + INTERVAL '1 month');

-- Insert test coupons
INSERT INTO coupons (id, code, discount_type, discount_value, max_uses, expires_at) VALUES
('coupon_1', 'WELCOME20', 'percentage', 20.00, 100, NOW() + INTERVAL '3 months'),
('coupon_2', 'SAVE10', 'fixed', 10.00, 50, NOW() + INTERVAL '1 month');

COMMIT;
