-- Create notifications system for support tickets
-- This script creates the database schema for notifications

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title CHARACTER VARYING(255) NOT NULL,
    message TEXT NOT NULL,
    type CHARACTER VARYING(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_ticket_id TEXT REFERENCES support_tickets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(related_ticket_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id TEXT,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_ticket_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    notification_id TEXT;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_ticket_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_ticket_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for ticket status changes
CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify user when ticket status changes
    IF OLD.status != NEW.status THEN
        PERFORM create_notification(
            NEW.user_id,
            'Ticket Status Updated',
            'Your support ticket "' || NEW.subject || '" status has been changed to ' || NEW.status,
            'info',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new ticket comments
CREATE OR REPLACE FUNCTION notify_new_ticket_comment()
RETURNS TRIGGER AS $$
DECLARE
    ticket_record RECORD;
    admin_users RECORD;
BEGIN
    -- Get ticket information
    SELECT * INTO ticket_record FROM support_tickets WHERE id = NEW.ticket_id;
    
    IF NEW.is_admin_response THEN
        -- Notify user when admin responds
        PERFORM create_notification(
            ticket_record.user_id,
            'New Response to Your Ticket',
            'Support team has responded to your ticket "' || ticket_record.subject || '"',
            'info',
            NEW.ticket_id
        );
    ELSE
        -- Notify all super admin users when user comments
        FOR admin_users IN SELECT id FROM users WHERE role = 'super_admin' LOOP
            PERFORM create_notification(
                admin_users.id,
                'New User Comment',
                'User has added a comment to ticket "' || ticket_record.subject || '"',
                'info',
                NEW.ticket_id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new tickets
CREATE OR REPLACE FUNCTION notify_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
    admin_users RECORD;
BEGIN
    -- Notify all super admin users when new ticket is created
    FOR admin_users IN SELECT id FROM users WHERE role = 'super_admin' LOOP
        PERFORM create_notification(
            admin_users.id,
            'New Support Ticket',
            'New support ticket created: "' || NEW.subject || '"',
            'info',
            NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_ticket_status_change
    AFTER UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_ticket_status_change();

CREATE TRIGGER trigger_new_ticket_comment
    AFTER INSERT ON ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_ticket_comment();

CREATE TRIGGER trigger_new_ticket
    AFTER INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_ticket();
