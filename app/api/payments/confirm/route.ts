import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { paymentIntentId, planId, paymentMethod, couponId, discountAmount = 0 } = await request.json()

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

    // Calculate end date
    const endDate =
      plan.duration_months === 0
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days for trial
        : new Date(Date.now() + plan.duration_months * 30 * 24 * 60 * 60 * 1000)

    // Create subscription
    const newSubscription = await sql`
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, start_date, end_date, payment_method
      ) VALUES (
        ${userId}, ${planId}, 'active', NOW(), ${endDate.toISOString()}, ${paymentMethod}
      )
      RETURNING *
    `

    // Update payment status
    await sql`
      UPDATE subscription_payments 
      SET 
        subscription_id = ${newSubscription[0].id},
        payment_status = 'completed',
        updated_at = NOW()
      WHERE transaction_id = ${paymentIntentId} AND user_id = ${userId}
    `

    // Update user's current subscription
    await sql`
      UPDATE users SET current_subscription_id = ${newSubscription[0].id} WHERE id = ${userId}
    `

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

        console.log("[v0] Coupon usage recorded in payment confirmation:", {
          couponId,
          userId,
          subscriptionId: newSubscription[0].id,
          discountAmount,
        })
      } catch (couponError) {
        console.error("[v0] Error recording coupon usage in payment confirmation:", couponError)
        // Don't fail the payment confirmation if coupon tracking fails
      }
    }

    console.log("[v0] Payment confirmed successfully:", {
      subscriptionId: newSubscription[0].id,
      paymentIntentId,
      couponApplied: !!couponId,
      discountAmount,
    })

    return NextResponse.json({
      subscription: newSubscription[0],
      success: true,
    })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
