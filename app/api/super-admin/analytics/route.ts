import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("SuperAdmin ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get platform overview stats
    const overviewStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM hotels) as total_hotels,
        (SELECT COUNT(*) FROM users WHERE role = 'hotel_owner') as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
        (SELECT COUNT(*) FROM stories WHERE is_active = true) as active_stories
    `

    // Get growth metrics (last 30 days)
    const growthStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM hotels WHERE created_at >= NOW() - INTERVAL '30 days') as new_hotels_30d,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days' AND role = 'hotel_owner') as new_users_30d,
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days') as new_orders_30d,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days') as revenue_30d
    `

    // Get daily revenue for the last 30 days
    const dailyRevenue = await sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // Get top performing hotels
    const topHotels = await sql`
      SELECT 
        h.id,
        h.name,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        (SELECT COUNT(*) FROM products WHERE hotel_id = h.id) as product_count
      FROM hotels h
      LEFT JOIN orders o ON h.id = o.hotel_id
      GROUP BY h.id, h.name
      ORDER BY revenue DESC
      LIMIT 10
    `

    // Get order status distribution
    const orderStatusStats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      GROUP BY status
    `

    // Get monthly growth trend (last 12 months)
    const monthlyGrowth = await sql`
      SELECT 
        DATE_TRUNC('month', h.created_at) as month,
        COUNT(DISTINCT h.id) as hotel_count,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM hotels h
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN orders o ON h.id = o.hotel_id
      WHERE h.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', h.created_at)
      ORDER BY month DESC
      LIMIT 12
    `

    // Get recent activity (last 7 days)
    const recentActivity = await sql`
      SELECT 
        'hotel' as type,
        h.name as title,
        'New hotel registered' as description,
        h.created_at as timestamp
      FROM hotels h
      WHERE h.created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'order' as type,
        CONCAT('Order #', o.order_number) as title,
        CONCAT('Order from ', h.name) as description,
        o.created_at as timestamp
      FROM orders o
      JOIN hotels h ON o.hotel_id = h.id
      WHERE o.created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'user' as type,
        CONCAT(u.first_name, ' ', u.last_name) as title,
        'New user registered' as description,
        u.created_at as timestamp
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '7 days' AND u.role = 'hotel_owner'
      
      ORDER BY timestamp DESC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      overview: overviewStats[0],
      growth: growthStats[0],
      dailyRevenue: dailyRevenue,
      topHotels: topHotels,
      orderStatus: orderStatusStats,
      monthlyGrowth: monthlyGrowth,
      recentActivity: recentActivity,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Super admin analytics fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
