-- HotelTec SaaS Database Reset Script
-- WARNING: This will delete all existing data and recreate tables for production use

-- Drop existing tables if they exist
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

-- Create hotels table for multi-tenant support
CREATE TABLE hotels (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hotel_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create orders table (updated version)
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hotel_id TEXT NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivered', 'cancelled')),
  payment_method VARCHAR(50) DEFAULT 'Room Charge',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX idx_products_hotel_id ON products(hotel_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_hotel_id ON orders(hotel_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_hotels_updated_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample hotel data (for demonstration)
INSERT INTO hotels (id, name, description, owner_id) VALUES
('hotel-demo-001', 'Grand Hotel Boutique', 'Luxury hotel with premium amenities and exceptional service', 
 (SELECT id FROM users LIMIT 1));

-- Insert sample products (for demonstration)
INSERT INTO products (hotel_id, name, description, price, category, rating, in_stock) VALUES
('hotel-demo-001', 'Premium Coffee Beans', 'Freshly roasted coffee beans from local farms', 45.00, 'Beverages', 4.8, true),
('hotel-demo-001', 'Luxury Bath Set', 'Complete spa experience with premium amenities', 120.00, 'Amenities', 4.9, true),
('hotel-demo-001', 'Artisan Chocolates', 'Hand-crafted chocolates made by local artisans', 35.00, 'Snacks', 4.7, true),
('hotel-demo-001', 'Hotel Bathrobe', 'Soft and comfortable bathrobe with hotel logo', 85.00, 'Apparel', 4.6, true),
('hotel-demo-001', 'Local Wine Selection', 'Curated selection of local wines', 75.00, 'Beverages', 4.5, true),
('hotel-demo-001', 'Spa Towel Set', 'Premium cotton towels for ultimate comfort', 55.00, 'Amenities', 4.4, true);

-- Clear any existing orders (start fresh)
-- Orders table is already empty from DROP/CREATE above
