-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Insert sample products
INSERT INTO products (name, category, price, stock, description, image, status) VALUES
('Premium Coffee Beans', 'Food & Beverage', 45.00, 25, 'Freshly roasted coffee beans from local farms', '/pile-of-coffee-beans.png', 'active'),
('Luxury Bath Set', 'Amenities', 120.00, 15, 'Complete spa experience with premium amenities', '/luxurious-bath-set.png', 'active'),
('Artisan Chocolates', 'Food & Beverage', 35.00, 30, 'Hand-crafted chocolates made by local artisans', '/assorted-chocolates.png', 'active'),
('Hotel Bathrobe', 'Apparel', 85.00, 8, 'Soft and comfortable bathrobe with hotel logo', '/plush-hotel-robe.png', 'low_stock')
ON CONFLICT DO NOTHING;
