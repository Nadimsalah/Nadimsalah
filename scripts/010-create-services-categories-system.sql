-- Create services categories system integrated with products
-- This replaces the previous services system with a product-focused approach

-- Create service categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    category_group VARCHAR(50) NOT NULL, -- e.g., 'Food & Beverage', 'Wellness & Relaxation'
    description TEXT,
    icon VARCHAR(50), -- icon name for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hotel service categories (which categories each hotel has enabled)
CREATE TABLE IF NOT EXISTS hotel_service_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    service_category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, service_category_id)
);

-- Create product service categories junction table (products can belong to multiple categories)
CREATE TABLE IF NOT EXISTS product_service_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    service_category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, service_category_id)
);

-- Insert default service categories
INSERT INTO service_categories (name, category_group, description, icon) VALUES
-- Food & Beverage
('Restaurant Menu', 'Food & Beverage', 'Main dining restaurant offerings', 'utensils'),
('Room Service', 'Food & Beverage', 'In-room dining options', 'room-service'),
('Bar & Cocktails', 'Food & Beverage', 'Alcoholic and non-alcoholic beverages', 'wine'),
('Coffee & Pastries', 'Food & Beverage', 'Coffee shop and bakery items', 'coffee'),
('Breakfast Menu', 'Food & Beverage', 'Morning dining options', 'sunrise'),

-- Wellness & Relaxation
('Spa Services', 'Wellness & Relaxation', 'Massage and spa treatments', 'spa'),
('Fitness Equipment', 'Wellness & Relaxation', 'Gym and fitness facilities', 'dumbbell'),
('Pool Services', 'Wellness & Relaxation', 'Swimming pool amenities', 'waves'),
('Wellness Products', 'Wellness & Relaxation', 'Health and wellness items', 'heart'),

-- Leisure & Recreation
('Entertainment', 'Leisure & Recreation', 'Shows, events, and activities', 'music'),
('Sports & Activities', 'Leisure & Recreation', 'Recreational sports and games', 'activity'),
('Tours & Excursions', 'Leisure & Recreation', 'Local tours and experiences', 'map'),
('Kids Activities', 'Leisure & Recreation', 'Children entertainment and activities', 'baby'),

-- Shopping & Lifestyle
('Gift Shop', 'Shopping & Lifestyle', 'Souvenirs and gift items', 'gift'),
('Fashion & Accessories', 'Shopping & Lifestyle', 'Clothing and accessories', 'shirt'),
('Local Crafts', 'Shopping & Lifestyle', 'Handmade and local products', 'palette'),
('Electronics', 'Shopping & Lifestyle', 'Tech gadgets and accessories', 'smartphone'),

-- Transport & Mobility
('Airport Transfer', 'Transport & Mobility', 'Transportation to/from airport', 'plane'),
('Car Rental', 'Transport & Mobility', 'Vehicle rental services', 'car'),
('Local Transport', 'Transport & Mobility', 'City transportation options', 'bus'),
('Taxi Services', 'Transport & Mobility', 'On-demand taxi services', 'car-taxi'),

-- Business & Events
('Meeting Rooms', 'Business & Events', 'Conference and meeting facilities', 'presentation'),
('Business Services', 'Business & Events', 'Printing, fax, and office services', 'briefcase'),
('Event Planning', 'Business & Events', 'Wedding and event organization', 'calendar'),
('Catering Services', 'Business & Events', 'Event catering and banquet services', 'chef-hat'),

-- Practical Guest Services
('Laundry & Cleaning', 'Practical Guest Services', 'Laundry and dry cleaning services', 'shirt'),
('Concierge Services', 'Practical Guest Services', 'Guest assistance and recommendations', 'bell'),
('Room Amenities', 'Practical Guest Services', 'In-room products and services', 'bed'),
('Medical Services', 'Practical Guest Services', 'Healthcare and pharmacy services', 'stethoscope')

ON CONFLICT (name, category_group) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotel_service_categories_hotel_id ON hotel_service_categories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_service_categories_active ON hotel_service_categories(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_service_categories_product_id ON product_service_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_service_categories_service_id ON product_service_categories(service_category_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_group ON service_categories(category_group);
