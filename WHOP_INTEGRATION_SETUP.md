# Whop Checkout Integration Setup Guide

This guide will help you complete the Whop checkout integration for HotelTec's subscription system.

## Overview

HotelTec now uses Whop's embedded checkout for processing paid subscription payments (6-Month and 12-Month plans). The integration maintains all existing features including:

- ✅ Coupon code validation and discounts
- ✅ Free trial flow (no payment required)
- ✅ User account creation
- ✅ Hotel store setup
- ✅ Subscription tracking in database

## Setup Steps

### 1. Create Whop Account & Products

1. Go to [Whop Dashboard](https://dash.whop.com) and create an account
2. Navigate to **Products** section
3. Create two subscription products:
   - **6-Month HotelTec Pack** - $299 for 6 months
   - **12-Month HotelTec Pack** - $499 for 12 months

### 2. Get Plan IDs

After creating your products in Whop:

1. Click on each product in your Whop dashboard
2. Copy the **Plan ID** (format: `plan_xxxxxxxxxxxxx`)
3. Update the plan IDs in `app/checkout/page.tsx`:

\`\`\`typescript
const WHOP_PLAN_IDS = {
  "6-month-pack": "plan_YOUR_6_MONTH_PLAN_ID_HERE",
  "12-month-pack": "plan_YOUR_12_MONTH_PLAN_ID_HERE",
}
\`\`\`

### 3. Configure Whop Settings

In your Whop dashboard:

1. **Branding**: Customize checkout appearance to match HotelTec
2. **Success URL**: Set to `https://yourdomain.com/dashboard?welcome=true&setup=true`
3. **Webhook URL**: Set to `https://yourdomain.com/api/webhooks/whop` (optional, for advanced tracking)

### 4. Test the Integration

#### Test Free Trial (No Whop)
1. Go to `/checkout?plan=free-trial`
2. Fill in user information
3. Click "Start Free Trial"
4. Verify account creation and redirect to dashboard

#### Test Paid Plans (With Whop)
1. Go to `/checkout?plan=6-month-pack`
2. Fill in user information
3. Apply a coupon code (optional)
4. Click "Complete Purchase"
5. Whop checkout modal should appear
6. Complete test payment using Whop's test mode
7. Verify account creation and subscription activation

### 5. Coupon Integration

Coupons work seamlessly with Whop:

- Discounts are calculated **before** Whop checkout
- If coupon makes plan 100% free, Whop checkout is skipped
- Coupon metadata is passed to Whop for tracking
- Discount amount is stored in HotelTec database

Example coupon flow:
\`\`\`
Original Price: $299
Coupon: SAVE50 (50% off)
Final Price: $149.50 → Passed to Whop checkout
\`\`\`

## How It Works

### Payment Flow

\`\`\`
User selects plan → Fills info → Applies coupon (optional)
                                        ↓
                    Is final price > $0?
                    ↙                    ↘
                  YES                    NO
                   ↓                      ↓
          Open Whop Checkout      Create free account
                   ↓                      ↓
          User completes payment   Redirect to dashboard
                   ↓
          Whop onComplete callback
                   ↓
          Create account + subscription
                   ↓
          Redirect to dashboard
\`\`\`

### Key Features

1. **Embedded Checkout**: Whop checkout opens in a modal overlay, keeping users on HotelTec
2. **Metadata Passing**: User info and coupon data sent to Whop for tracking
3. **Success Callback**: `onComplete` handler creates account after successful payment
4. **Error Handling**: `onError` handler shows user-friendly error messages
5. **Database Integration**: Payment records stored with Whop transaction IDs

## API Endpoints

### `/api/checkout` (POST)
Handles both free and paid subscription creation.

**Request Body:**
\`\`\`json
{
  "type": "subscription",
  "planId": "6-month-pack",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@hotel.com",
    "hotelName": "Grand Hotel",
    "password": "securepass123"
  },
  "couponId": "SAVE50",
  "paymentMethod": "whop",
  "whopPaymentData": {
    "id": "whop_transaction_id",
    "amount": 14950,
    "currency": "usd"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "user": { "id": "...", "email": "..." },
  "hotel": { "id": "...", "slug": "..." },
  "subscription": { "id": "...", "status": "active" }
}
\`\`\`

## Troubleshooting

### Whop Checkout Not Opening
- Check browser console for errors
- Verify Plan IDs are correct in `WHOP_PLAN_IDS`
- Ensure Whop SDK script is loading (`https://assets.whop.com/sdk/v3/whop-sdk.js`)

### Payment Successful But Account Not Created
- Check `/api/checkout` logs for errors
- Verify `onComplete` callback is firing
- Check database connection and user creation logic

### Coupon Not Applying Discount
- Verify coupon exists in database and is active
- Check `/api/coupons/validate` endpoint
- Ensure coupon code matches exactly (case-sensitive)

## Production Checklist

Before going live:

- [ ] Replace test Plan IDs with production Plan IDs
- [ ] Test complete checkout flow end-to-end
- [ ] Verify coupon discounts work correctly
- [ ] Test free trial flow (no payment)
- [ ] Configure Whop webhook for subscription management
- [ ] Set up proper error monitoring
- [ ] Test with real payment methods
- [ ] Verify email notifications work
- [ ] Check database records are created correctly
- [ ] Test upgrade flow for existing users

## Support

For Whop-specific issues:
- [Whop Documentation](https://docs.whop.com)
- [Whop Support](https://support.whop.com)

For HotelTec integration issues:
- Check application logs
- Review database records
- Test API endpoints directly
