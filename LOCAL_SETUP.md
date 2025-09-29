# Local Development Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Git**

## Step 1: Install PostgreSQL

### On macOS (using Homebrew):
\`\`\`bash
brew install postgresql
brew services start postgresql
\`\`\`

### On Windows:
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### On Linux (Ubuntu/Debian):
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

## Step 2: Create Local Database

\`\`\`bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE hoteltec_dev;
CREATE USER hoteltec_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hoteltec_dev TO hoteltec_user;
\q
\`\`\`

## Step 3: Clone and Setup Project

\`\`\`bash
# Download the project files from v0
# Extract the ZIP file and navigate to the project directory
cd hoteltec-project

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
\`\`\`

## Step 4: Configure Environment Variables

Edit `.env.local` and update the database connection:

\`\`\`env
DATABASE_URL="postgresql://hoteltec_user:your_password@localhost:5432/hoteltec_dev"
POSTGRES_URL="postgresql://hoteltec_user:your_password@localhost:5432/hoteltec_dev"
PGHOST="localhost"
PGUSER="hoteltec_user"
PGPASSWORD="your_password"
PGDATABASE="hoteltec_dev"
\`\`\`

## Step 5: Setup Database Schema

\`\`\`bash
# Connect to your database and run the setup script
psql -h localhost -U hoteltec_user -d hoteltec_dev -f scripts/local-setup.sql

# Load seed data (optional)
psql -h localhost -U hoteltec_user -d hoteltec_dev -f scripts/local-seed-data.sql
\`\`\`

## Step 6: Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see your application.

## Test Accounts (from seed data)

- **Super Admin**: admin@hoteltec.com / password123
- **Hotel Owner 1**: john@grandhotel.com / password123  
- **Hotel Owner 2**: jane@oceanview.com / password123

## Troubleshooting

### Database Connection Issues:
1. Ensure PostgreSQL is running: `brew services list | grep postgresql`
2. Check if the database exists: `psql -l`
3. Verify user permissions: `psql -U hoteltec_user -d hoteltec_dev -c "SELECT 1;"`

### Port Already in Use:
\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

### Missing Dependencies:
\`\`\`bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Development Tips

1. **Database GUI**: Use tools like pgAdmin, DBeaver, or TablePlus for easier database management
2. **Environment Variables**: Never commit `.env.local` to version control
3. **Hot Reload**: The development server supports hot reload for most changes
4. **Logs**: Check the terminal for detailed error messages

## File Upload in Development

For local development, file uploads will be stored in the `public/uploads` directory. In production, they use Vercel Blob storage.
\`\`\`

```json file="" isHidden
