import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's hotel_id
    const hotelResult = await sql`
      SELECT h.id as hotel_id 
      FROM hotels h 
      WHERE h.owner_id = ${userId}
      LIMIT 1
    `

    if (hotelResult.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    const hotelId = hotelResult[0].hotel_id

    // Calculate store analytics
    const currentMonth = new Date()
    currentMonth.setDate(1) // First day of current month

    // Get total orders for this hotel
    const ordersResult = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN created_at >= ${currentMonth.toISOString()} THEN 1 END) as monthly_orders,
        COUNT(CASE WHEN phone_number IS NOT NULL THEN 1 END) as mobile_orders
      FROM orders 
      WHERE hotel_id = ${hotelId}
    `

    const orders = ordersResult[0] || { total_orders: 0, monthly_orders: 0, mobile_orders: 0 }

    // Calculate conversion rate (assuming 1 order per 8 visits on average)
    const estimatedVisits = Math.max(orders.monthly_orders * 8, orders.monthly_orders)
    const conversionRate = estimatedVisits > 0 ? ((orders.monthly_orders / estimatedVisits) * 100).toFixed(1) : "0.0"

    // Calculate mobile percentage
    const mobilePercentage =
      orders.total_orders > 0 ? ((orders.mobile_orders / orders.total_orders) * 100).toFixed(0) : "0"

    // Estimate QR scans (assuming 70% of orders come from QR scans)
    const qrScans = Math.floor(orders.monthly_orders * 0.7)

    const analytics = {
      storeViews: estimatedVisits.toString(),
      qrScans: qrScans.toString(),
      mobileOrders: `${mobilePercentage}%`,
      conversionRate: `${conversionRate}%`,
      totalOrders: orders.total_orders,
      monthlyOrders: orders.monthly_orders,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching store analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
