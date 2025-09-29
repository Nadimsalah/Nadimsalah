-- Check if there are any super admin users in the database
SELECT id, first_name, last_name, email, role 
FROM users 
WHERE role = 'super_admin';

-- If no super admin users exist, let's see all users and their roles
SELECT id, first_name, last_name, email, role 
FROM users 
ORDER BY created_at DESC;

-- Check recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
