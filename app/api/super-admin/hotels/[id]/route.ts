import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("SuperAdmin ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hotelId = params.id

    // Get detailed hotel information
    const hotelResult = await sql`
      SELECT 
        h.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.created_at as owner_created_at
      FROM hotels h
      LEFT JOIN users u ON h.owner_id = u.id
      WHERE h.id = ${hotelId}
    `

    if (hotelResult.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    const hotel = hotelResult[0]

    // Get hotel statistics
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE hotel_id = ${hotelId}) as product_count,
        (SELECT COUNT(*) FROM orders WHERE hotel_id = ${hotelId}) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE hotel_id = ${hotelId} AND status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE hotel_id = ${hotelId} AND status = 'delivered') as delivered_orders,
        (SELECT COUNT(*) FROM stories WHERE hotel_id = ${hotelId}) as total_stories,
        (SELECT COUNT(*) FROM stories WHERE hotel_id = ${hotelId} AND is_active = true) as active_stories,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE hotel_id = ${hotelId}) as total_revenue
    `

    // Get recent orders
    const recentOrders = await sql`
      SELECT id, order_number, guest_name, total_amount, status, created_at
      FROM orders 
      WHERE hotel_id = ${hotelId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Get recent products
    const recentProducts = await sql`
      SELECT id, name, price, category, in_stock, created_at
      FROM products 
      WHERE hotel_id = ${hotelId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      hotel: hotel,
      stats: stats[0],
      recentOrders: recentOrders,
      recentProducts: recentProducts,
    })
  } catch (error) {
    console.error("Super admin hotel detail fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
