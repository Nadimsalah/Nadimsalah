import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Get user's current subscription with plan details
    const subscriptions = await sql`
      SELECT 
        us.*,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price,
        sp.billing_cycle,
        sp.duration_months,
        sp.max_products,
        sp.features,
        EXTRACT(DAY FROM us.end_date - NOW())::INTEGER as days_remaining,
        (us.status = 'active' OR us.status = 'trial') AND us.end_date > NOW() as is_active
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${userId}
      ORDER BY us.created_at DESC
      LIMIT 1
    `

    return NextResponse.json({
      subscription: subscriptions[0] || null,
      success: true,
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    // <CHANGE> Added coupon parameters to request body
    const { planId, paymentMethod, couponId, discountAmount = 0 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Get plan details
    const plans = await sql`
      SELECT * FROM subscription_plans WHERE id = ${planId} AND is_active = true
    `

    if (plans.length === 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const plan = plans[0]

    // <CHANGE> Calculate final amount after coupon discount
    const originalAmount = plan.price
    const finalAmount = Math.max(0, originalAmount - discountAmount)

    // Calculate end date based on plan duration
    const endDate =
      plan.duration_months === 0
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days for trial
        : new Date(Date.now() + plan.duration_months * 30 * 24 * 60 * 60 * 1000)

    // Create new subscription
    const newSubscription = await sql`
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, start_date, end_date, payment_method
      ) VALUES (
        ${userId}, ${planId}, 
        ${finalAmount === 0 ? "trial" : "active"}, 
        NOW(), ${endDate.toISOString()}, ${paymentMethod}
      )
      RETURNING *
    `

    // Update user's current subscription
    await sql`
      UPDATE users SET current_subscription_id = ${newSubscription[0].id} WHERE id = ${userId}
    `

    // <CHANGE> Record coupon usage if coupon was applied
    if (couponId && discountAmount > 0) {
      try {
        // Record coupon usage
        await sql`
          INSERT INTO coupon_usage (coupon_id, user_id, subscription_id, discount_amount)
          VALUES (${couponId}, ${userId}, ${newSubscription[0].id}, ${discountAmount})
        `

        // Update coupon used count
        await sql`
          UPDATE coupons SET used_count = used_count + 1 WHERE id = ${couponId}
        `

        console.log('[v0] Coupon usage recorded:', { couponId, userId, discountAmount })
      } catch (couponError) {
        console.error('[v0] Error recording coupon usage:', couponError)
        // Don't fail the subscription creation if coupon tracking fails
      }
    }

    // If it's a paid plan, create payment record
    if (finalAmount > 0) {
      await sql`
        INSERT INTO subscription_payments (
          subscription_id, user_id, amount, currency, payment_method, payment_status
        ) VALUES (
          ${newSubscription[0].id}, ${userId}, ${finalAmount}, 'USD', ${paymentMethod}, 'pending'
        )
      `
    }

    console.log('[v0] Subscription created successfully:', {
      subscriptionId: newSubscription[0].id,
      originalAmount,
      discountAmount,
      finalAmount,
      couponApplied: !!couponId
    })

    return NextResponse.json({
      subscription: newSubscription[0],
      success: true,
    })
  } catch (error) {
    console.error("Subscription creation error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
