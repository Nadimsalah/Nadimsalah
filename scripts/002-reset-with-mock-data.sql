-- Reset Database with Mock Data
-- WARNING: This will delete all existing data and recreate tables with sample data

-- Drop existing table and recreate
DROP TABLE IF EXISTS contact_requests CASCADE;

-- Create contact_requests table
CREATE TABLE contact_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert mock data
INSERT INTO contact_requests (name, email, message, status, created_at) VALUES
('Sarah Johnson', 'sarah.johnson@techcorp.com', 'Hi! I''m interested in discussing a complete website redesign for our tech startup. We need something modern and scalable that can handle our growing user base. Could we schedule a call this week?', 'new', CURRENT_TIMESTAMP - INTERVAL '2 hours'),

('Michael Chen', 'mchen@designstudio.co', 'We''re looking for a freelance developer to help with our client projects. Your portfolio looks impressive! Do you have availability for ongoing collaboration? We typically work on e-commerce and SaaS platforms.', 'in_progress', CURRENT_TIMESTAMP - INTERVAL '1 day'),

('Emily Rodriguez', 'emily.r@nonprofit.org', 'Our nonprofit organization needs a new website to better showcase our mission and accept donations online. We have a limited budget but are passionate about our cause. Would love to discuss options with you.', 'new', CURRENT_TIMESTAMP - INTERVAL '3 days'),

('David Park', 'david@startupventure.io', 'Impressive work on your recent projects! We''re a Series A startup looking for someone to lead our frontend development. The role would involve React, Next.js, and working with our design team. Interested in learning more?', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 week'),

('Lisa Thompson', 'lisa.thompson@retailbrand.com', 'We need to revamp our e-commerce platform before the holiday season. Timeline is tight but budget is flexible for the right developer. Can you handle integrations with Shopify and custom checkout flows?', 'new', CURRENT_TIMESTAMP - INTERVAL '5 hours'),

('Alex Kumar', 'alex@mobilefirst.dev', 'Love your approach to responsive design! We''re building a mobile-first application and need someone with your expertise. The project involves complex animations and performance optimization. Available for a quick chat?', 'in_progress', CURRENT_TIMESTAMP - INTERVAL '2 days'),

('Rachel Green', 'rachel@consultingfirm.biz', 'Our consulting firm needs a professional website that reflects our expertise. We''re looking for clean, corporate design with client portal functionality. What''s your typical timeline for projects like this?', 'new', CURRENT_TIMESTAMP - INTERVAL '6 hours'),

('James Wilson', 'j.wilson@techagency.com', 'We''re expanding our development team and looking for reliable freelancers. Your Next.js skills are exactly what we need for our upcoming client projects. Would you be interested in a partnership discussion?', 'completed', CURRENT_TIMESTAMP - INTERVAL '10 days');
