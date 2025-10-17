# Whop Checkout Integration Setup

## Overview
This project integrates Whop embedded checkout for subscription payments with webhook support for secure provisioning.

## Products & Plans

### 6-Month Pack - $299 / 6 months
- **Product ID:** `prod_95gEMmTW8USDI`
- **Plan ID:** ⚠️ **REQUIRED** - Get from Whop Dashboard (see instructions below)
- Features:
  - Most popular, full features
  - Unlimited products
  - Advanced analytics
  - Custom branding
  - Priority support

### 12-Month Pack - $499 / 12 months
- **Product ID:** `prod_4LZ7DcqeZbn8z`
- **Plan ID:** ⚠️ **REQUIRED** - Get from Whop Dashboard (see instructions below)
- Features:
  - Best value, white-label + support
  - Everything in 6-Month
  - White-label solution
  - Dedicated support
  - 24/7 phone support

## ⚠️ IMPORTANT: Why Products Aren't Showing

**The embedded checkout needs PLAN IDs, not PRODUCT IDs.**

Each product in Whop can have multiple pricing plans. The checkout displays a specific plan, not the product itself.

### How to Find Your Plan IDs:

1. Go to [Whop Dashboard](https://dash.whop.com)
2. Click **Products** in the sidebar
3. Click on your product (e.g., "6-Month Pack")
4. Look for the **Plans** section
5. You'll see a plan with pricing - click on it or hover to see the **Plan ID**
6. The Plan ID looks like: `plan_xxxxxxxxxx`
7. Copy this ID and use it in your code

**If you don't see any plans:**
- You need to create a pricing plan for each product
- Click "Add Plan" or "Create Plan"
- Set the price and billing cycle
- Save and copy the generated Plan ID

## Setup Instructions

### 1. Create Plans in Whop Dashboard

1. Go to [Whop Dashboard](https://dash.whop.com)
2. Navigate to **Products** section
3. For each product, create a Plan:
   - **6-Month Plan:**
     - Product: `prod_95gEMmTW8USDI`
     - Price: $299
     - Billing cycle: Every 6 months
     - Copy the generated `plan_xxx` ID
   
   - **12-Month Plan:**
     - Product: `prod_4LZ7DcqeZbn8z`
     - Price: $499
     - Billing cycle: Every 12 months
     - Copy the generated `plan_xxx` ID

### 2. Update Code with Plan IDs

Replace the placeholder plan IDs in these files:

**app/pricing/page.tsx:**
\`\`\`typescript
const PLAN_6M = "plan_xxxxxxxxxx" // Get from: Dashboard → Products → 6-Month Pack → Plans
const PLAN_12M = "plan_xxxxxxxxxx" // Get from: Dashboard → Products → 12-Month Pack → Plans
\`\`\`

**public/embedded-checkout.html:**
\`\`\`javascript
const PLAN_6M = "plan_xxxxxxxxxx"; // Get from: Dashboard → Products → 6-Month Pack → Plans
const PLAN_12M = "plan_xxxxxxxxxx"; // Get from: Dashboard → Products → 12-Month Pack → Plans
\`\`\`

### 3. Configure Webhook

1. In Whop Dashboard, go to **Settings** → **Webhooks**
2. Add webhook endpoint: `https://hoteltec.app/api/whop/webhook`
3. Select events to listen for:
   - `checkout.completed`
   - `subscription.created`
   - `subscription.renewed`
   - `subscription.canceled`
   - `refund.processed`
4. Copy the webhook secret (already configured in code)

### 4. Set Environment Variables

Add to your Vercel project or `.env.local`:

\`\`\`bash
WHOP_WEBHOOK_SECRET=ws_5f4f26266a85447dcc49b562b715f467723556d449c414312104a092066c66e7
DATABASE_URL=your_neon_database_url
\`\`\`

### 5. Run Database Migration

Execute the SQL script to create the subscriptions table:

\`\`\`bash
# Run from v0 interface or your database client
scripts/create-subscriptions-table.sql
\`\`\`

## File Structure

\`\`\`
app/
├── pricing/page.tsx          # Main pricing page with embedded checkout
├── thank-you/page.tsx        # Success page after payment
└── api/
    ├── bookings/route.ts     # Original bookings endpoint
    └── whop/
        └── webhook/route.ts  # Webhook handler for Whop events

public/
└── embedded-checkout.html    # HTML fallback version

scripts/
├── create-bookings-table.sql
└── create-subscriptions-table.sql
\`\`\`

## Endpoints

### Webhook Endpoint
- **URL:** `https://hoteltec.app/api/whop/webhook`
- **Method:** POST
- **Authentication:** HMAC signature verification
- **Events:** checkout.completed, subscription.created, subscription.renewed, subscription.canceled, refund.processed

### Pricing Page
- **URL:** `https://hoteltec.app/pricing`
- **Description:** React-based pricing page with embedded Whop checkout

### Thank You Page
- **URL:** `https://hoteltec.app/thank-you?receiptId=xxx`
- **Description:** Success page shown after payment completion

## Testing

1. **Local Development:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Visit `http://localhost:3000/pricing`

2. **Test Checkout:**
   - Select a plan (6-month or 12-month)
   - Complete test payment in Whop checkout
   - Verify webhook receives event
   - Check database for new subscription record

3. **Verify Webhook:**
   - Use Whop Dashboard to send test webhook events
   - Check server logs for `[v0]` debug messages
   - Confirm database updates correctly

## Troubleshooting

### ❌ Checkout not showing products
**Cause:** Using product IDs instead of plan IDs
**Solution:** 
1. Go to Whop Dashboard → Products
2. Click on each product
3. Find the Plan ID (starts with `plan_`)
4. Replace the IDs in `app/pricing/page.tsx`

### Checkout not loading
- Verify plan IDs are correct (must start with `plan_`)
- Check browser console for errors
- Ensure `@whop/checkout` package is installed
- Make sure plans are published/active in Whop Dashboard

### Webhook signature verification fails
- Confirm `WHOP_WEBHOOK_SECRET` matches Whop Dashboard
- Check webhook header name (may be `whop-signature` or `x-whop-signature`)

### Database errors
- Ensure `create-subscriptions-table.sql` has been executed
- Verify `DATABASE_URL` environment variable is set
- Check Neon database connection

## Security Notes

- Webhook signature verification is required for all webhook requests
- Never expose webhook secret in client-side code
- Always validate and sanitize webhook payload data
- Use HTTPS in production for all endpoints

## Support

For Whop-specific issues, refer to:
- [Whop Documentation](https://docs.whop.com)
- [Whop Checkout SDK](https://docs.whop.com/checkout)
- [Whop Webhooks Guide](https://docs.whop.com/webhooks)
