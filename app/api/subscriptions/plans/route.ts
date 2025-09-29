import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching subscription plans from database...")

    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscription_plans'
      )
    `

    console.log("[v0] Table exists check:", tableCheck)

    if (!tableCheck[0]?.exists) {
      console.log("[v0] subscription_plans table does not exist, creating default plans...")

      // Return default plans if table doesn't exist
      const defaultPlans = [
        {
          id: "free-trial",
          name: "Free Trial",
          description: "Try HotelTec for 14 days",
          price: 0,
          billing_cycle: "trial",
          duration_months: 0,
          max_products: 5,
          features: ["Up to 5 products", "Basic store features", "QR code access", "14-day trial"],
          is_active: true,
        },
        {
          id: "6-month-pack",
          name: "6-Month Pack",
          description: "Perfect for growing hotels",
          price: 299,
          billing_cycle: "6-monthly",
          duration_months: 6,
          max_products: -1,
          features: ["Unlimited products", "Advanced analytics", "Priority support", "Custom branding"],
          is_active: true,
        },
        {
          id: "12-month-pack",
          name: "12-Month Pack",
          description: "Best value for established hotels",
          price: 499,
          billing_cycle: "yearly",
          duration_months: 12,
          max_products: -1,
          features: ["Unlimited products", "Advanced analytics", "Priority support", "Custom branding", "API access"],
          is_active: true,
        },
      ]

      return NextResponse.json({
        plans: defaultPlans,
        success: true,
      })
    }

    const plans = await sql`
      SELECT * FROM subscription_plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `

    console.log("[v0] Fetched plans:", plans)

    return NextResponse.json({
      plans,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Plans fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
