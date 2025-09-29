import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { planId, paymentMethod, couponId, discountAmount = 0, finalAmount } = await request.json()

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

    const originalAmount = plan.price
    const paymentAmount = finalAmount !== undefined ? finalAmount : Math.max(0, originalAmount - discountAmount)

    // For free trial or fully discounted plans, no payment needed
    if (paymentAmount === 0) {
      return NextResponse.json({
        clientSecret: null,
        amount: 0,
        originalAmount,
        discountAmount,
        currency: "USD",
        planName: plan.name,
        couponApplied: !!couponId,
        success: true,
      })
    }

    // For paid plans, create payment intent
    // This is a simplified version - in production, you'd integrate with Stripe/PayPal
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(paymentAmount * 100), // Convert to cents
      currency: "usd",
      status: "requires_payment_method",
    }

    // Store payment intent for tracking
    await sql`
      INSERT INTO subscription_payments (
        user_id, amount, currency, payment_method, payment_status, transaction_id
      ) VALUES (
        ${userId}, ${paymentAmount}, 'USD', ${paymentMethod}, 'pending', ${paymentIntent.id}
      )
    `

    console.log("[v0] Payment intent created:", {
      paymentIntentId: paymentIntent.id,
      originalAmount,
      discountAmount,
      finalAmount: paymentAmount,
      couponApplied: !!couponId,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentAmount,
      originalAmount,
      discountAmount,
      currency: "USD",
      planName: plan.name,
      couponApplied: !!couponId,
      success: true,
    })
  } catch (error) {
    console.error("Payment intent creation error:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
