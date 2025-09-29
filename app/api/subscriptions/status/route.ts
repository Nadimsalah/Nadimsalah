import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Check subscription status using the database function
    const status = await sql`
      SELECT * FROM check_subscription_status(${userId})
    `

    if (status.length === 0) {
      return NextResponse.json({
        isActive: false,
        planName: null,
        endDate: null,
        daysRemaining: 0,
        maxProducts: 5,
        success: true,
      })
    }

    return NextResponse.json({
      isActive: status[0].is_active,
      planName: status[0].plan_name,
      endDate: status[0].end_date,
      daysRemaining: status[0].days_remaining,
      maxProducts: status[0].max_products,
      success: true,
    })
  } catch (error) {
    console.error("Subscription status check error:", error)
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 })
  }
}
