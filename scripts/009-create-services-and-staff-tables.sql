-- Create services management and staff tables

-- Services table to store all available services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel services table to track which services each hotel has enabled
CREATE TABLE IF NOT EXISTS hotel_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, service_id)
);

-- Staff table to store staff accounts
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff services table to link staff to specific services
CREATE TABLE IF NOT EXISTS staff_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, service_id)
);

-- Insert default services with categories
INSERT INTO services (name, category, icon, description) VALUES
-- Food & Beverage
('Gourmet Restaurant', 'Food & Beverage', '🍽️', 'Fine dining restaurant with gourmet cuisine'),
('Buffet Restaurant', 'Food & Beverage', '🍴', 'All-you-can-eat buffet dining'),
('Rooftop Restaurant', 'Food & Beverage', '🏙️', 'Restaurant with panoramic city views'),
('Theme Restaurant', 'Food & Beverage', '🎭', 'Themed dining experience'),
('Cocktail Bar', 'Food & Beverage', '🍸', 'Premium cocktail and spirits bar'),
('Wine Bar', 'Food & Beverage', '🍷', 'Curated wine selection and tastings'),
('Shisha Lounge', 'Food & Beverage', '💨', 'Traditional shisha and hookah lounge'),
('Café / Coffee Shop', 'Food & Beverage', '☕', 'Coffee, pastries, and light meals'),
('Room Service', 'Food & Beverage', '🛎️', 'In-room dining service'),
('Poolside Bar', 'Food & Beverage', '🏊', 'Bar service by the pool'),
('Beach Bar', 'Food & Beverage', '🏖️', 'Beachside drinks and snacks'),
('Continental Breakfast', 'Food & Beverage', '🥐', 'Continental breakfast service'),
('À la Carte Breakfast', 'Food & Beverage', '🍳', 'Made-to-order breakfast menu'),
('Banquet Service', 'Food & Beverage', '🎉', 'Event catering and banquet halls'),

-- Wellness & Relaxation
('Spa & Massage Center', 'Wellness & Relaxation', '💆', 'Full-service spa and massage treatments'),
('Hammam', 'Wellness & Relaxation', '🛁', 'Traditional Turkish/Moroccan bath'),
('Sauna & Steam Room', 'Wellness & Relaxation', '🧖', 'Sauna and steam room facilities'),
('Jacuzzi / Hot Tubs', 'Wellness & Relaxation', '🛀', 'Hot tub and jacuzzi facilities'),
('Yoga & Meditation', 'Wellness & Relaxation', '🧘', 'Yoga classes and meditation rooms'),
('Beauty Salon', 'Wellness & Relaxation', '💄', 'Hair, beauty, and grooming services'),
('Fitness / Gym', 'Wellness & Relaxation', '💪', 'Fully equipped fitness center'),

-- Leisure & Recreation
('Indoor Swimming Pool', 'Leisure & Recreation', '🏊', 'Climate-controlled indoor pool'),
('Outdoor Swimming Pool', 'Leisure & Recreation', '🌊', 'Outdoor swimming pool'),
('Rooftop Pool', 'Leisure & Recreation', '🏙️', 'Rooftop pool with city views'),
('Kids Club', 'Leisure & Recreation', '👶', 'Supervised activities for children'),
('Babysitting Service', 'Leisure & Recreation', '🍼', 'Professional childcare services'),
('Game Room', 'Leisure & Recreation', '🎮', 'Billiards, ping-pong, video games'),
('Cinema Room', 'Leisure & Recreation', '🎬', 'Private cinema and theater'),
('Tennis Court', 'Leisure & Recreation', '🎾', 'Professional tennis facilities'),
('Golf Course', 'Leisure & Recreation', '⛳', 'Golf course and driving range'),
('Beach Club', 'Leisure & Recreation', '🏖️', 'Private beach access and facilities'),
('Tour Booking', 'Leisure & Recreation', '🗺️', 'Local excursions and tour planning'),

-- Shopping & Lifestyle
('Boutique Shops', 'Shopping & Lifestyle', '🛍️', 'Luxury brands and designer items'),
('Souvenir Shop', 'Shopping & Lifestyle', '🎁', 'Local crafts and memorabilia'),
('Jewelry Store', 'Shopping & Lifestyle', '💎', 'Fine jewelry and accessories'),
('Convenience Store', 'Shopping & Lifestyle', '🏪', 'Essential items and snacks'),
('Perfume Shop', 'Shopping & Lifestyle', '🌸', 'Fragrances and cosmetics'),
('Art Gallery', 'Shopping & Lifestyle', '🎨', 'Local art exhibitions and sales'),

-- Transport & Mobility
('Airport Shuttle', 'Transport & Mobility', '✈️', 'Airport transfer service'),
('Car Rental', 'Transport & Mobility', '🚗', 'Vehicle rental services'),
('Limousine Service', 'Transport & Mobility', '🚙', 'Luxury transportation'),
('Valet Parking', 'Transport & Mobility', '🅿️', 'Professional parking service'),
('Bike Rental', 'Transport & Mobility', '🚲', 'Bicycle rental and tours'),
('Scooter Rental', 'Transport & Mobility', '🛵', 'Scooter and motorbike rental'),
('Yacht Rental', 'Transport & Mobility', '⛵', 'Boat and yacht charter services'),

-- Business & Events
('Meeting Rooms', 'Business & Events', '👥', 'Professional meeting facilities'),
('Conference Center', 'Business & Events', '🏢', 'Large conference and convention space'),
('Co-working Spaces', 'Business & Events', '💻', 'Shared workspace facilities'),
('Business Center', 'Business & Events', '🖨️', 'Printing, fax, and computer services'),
('Event Planning', 'Business & Events', '🎊', 'Professional event coordination'),
('Wedding Planning', 'Business & Events', '💒', 'Wedding and ceremony services'),

-- Practical Guest Services
('Laundry Service', 'Practical Guest Services', '👕', 'Laundry and dry cleaning'),
('Concierge Service', 'Practical Guest Services', '🎩', 'Personal concierge assistance'),
('Butler Service', 'Practical Guest Services', '🤵', 'Personal butler service'),
('24/7 Reception', 'Practical Guest Services', '🏨', 'Round-the-clock front desk'),
('Security Service', 'Practical Guest Services', '🛡️', '24/7 security and surveillance'),
('Currency Exchange', 'Practical Guest Services', '💱', 'Foreign currency exchange'),
('Tour Guide Service', 'Practical Guest Services', '🗣️', 'Professional tour guides'),
('Medical Assistance', 'Practical Guest Services', '⚕️', 'On-call doctor and medical care'),
('Pet Services', 'Practical Guest Services', '🐕', 'Pet-sitting and grooming services');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotel_services_hotel_id ON hotel_services(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_services_service_id ON hotel_services(service_id);
CREATE INDEX IF NOT EXISTS idx_staff_hotel_id ON staff(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON staff_services(service_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
