import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const period = searchParams.get("period") // today, yesterday, week, year

    console.log("[v0] Earnings API called with params:", { startDate, endDate, period })

    const now = new Date()
    let totalEarningsResult
    let earningsByHotelResult

    // Get total earnings
    if (startDate && endDate) {
      totalEarningsResult = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total_earnings
        FROM orders 
        WHERE status = 'delivered' 
          AND order_date >= ${startDate} 
          AND order_date <= ${endDate}
      `
    } else if (period) {
      switch (period) {
        case "today": {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
          totalEarningsResult = await sql`
            SELECT COALESCE(SUM(total_amount), 0) as total_earnings
            FROM orders 
            WHERE status = 'delivered' 
              AND order_date >= ${todayStart.toISOString()} 
              AND order_date < ${todayEnd.toISOString()}
          `
          break
        }
        case "yesterday": {
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000)
          totalEarningsResult = await sql`
            SELECT COALESCE(SUM(total_amount), 0) as total_earnings
            FROM orders 
            WHERE status = 'delivered' 
              AND order_date >= ${yesterdayStart.toISOString()} 
              AND order_date < ${yesterdayEnd.toISOString()}
          `
          break
        }
        case "week": {
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
          totalEarningsResult = await sql`
            SELECT COALESCE(SUM(total_amount), 0) as total_earnings
            FROM orders 
            WHERE status = 'delivered' 
              AND order_date >= ${weekStart.toISOString()}
          `
          break
        }
        case "year": {
          const yearStart = new Date(now.getFullYear(), 0, 1)
          totalEarningsResult = await sql`
            SELECT COALESCE(SUM(total_amount), 0) as total_earnings
            FROM orders 
            WHERE status = 'delivered' 
              AND order_date >= ${yearStart.toISOString()}
          `
          break
        }
        default:
          totalEarningsResult = await sql`
            SELECT COALESCE(SUM(total_amount), 0) as total_earnings
            FROM orders 
            WHERE status = 'delivered'
          `
      }
    } else {
      totalEarningsResult = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total_earnings
        FROM orders 
        WHERE status = 'delivered'
      `
    }

    // Get earnings by hotel with similar date filtering
    if (startDate && endDate) {
      earningsByHotelResult = await sql`
        SELECT 
          h.name as hotel_name,
          h.id as hotel_id,
          COALESCE(SUM(o.total_amount), 0) as earnings,
          COUNT(o.id) as order_count
        FROM hotels h
        LEFT JOIN orders o ON h.id = o.hotel_id 
          AND o.status = 'delivered' 
          AND o.order_date >= ${startDate} 
          AND o.order_date <= ${endDate}
        GROUP BY h.id, h.name
        ORDER BY earnings DESC
      `
    } else if (period) {
      switch (period) {
        case "today": {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
          earningsByHotelResult = await sql`
            SELECT 
              h.name as hotel_name,
              h.id as hotel_id,
              COALESCE(SUM(o.total_amount), 0) as earnings,
              COUNT(o.id) as order_count
            FROM hotels h
            LEFT JOIN orders o ON h.id = o.hotel_id 
              AND o.status = 'delivered' 
              AND o.order_date >= ${todayStart.toISOString()} 
              AND o.order_date < ${todayEnd.toISOString()}
            GROUP BY h.id, h.name
            ORDER BY earnings DESC
          `
          break
        }
        case "yesterday": {
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000)
          earningsByHotelResult = await sql`
            SELECT 
              h.name as hotel_name,
              h.id as hotel_id,
              COALESCE(SUM(o.total_amount), 0) as earnings,
              COUNT(o.id) as order_count
            FROM hotels h
            LEFT JOIN orders o ON h.id = o.hotel_id 
              AND o.status = 'delivered' 
              AND o.order_date >= ${yesterdayStart.toISOString()} 
              AND o.order_date < ${yesterdayEnd.toISOString()}
            GROUP BY h.id, h.name
            ORDER BY earnings DESC
          `
          break
        }
        case "week": {
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
          earningsByHotelResult = await sql`
            SELECT 
              h.name as hotel_name,
              h.id as hotel_id,
              COALESCE(SUM(o.total_amount), 0) as earnings,
              COUNT(o.id) as order_count
            FROM hotels h
            LEFT JOIN orders o ON h.id = o.hotel_id 
              AND o.status = 'delivered' 
              AND o.order_date >= ${weekStart.toISOString()}
            GROUP BY h.id, h.name
            ORDER BY earnings DESC
          `
          break
        }
        case "year": {
          const yearStart = new Date(now.getFullYear(), 0, 1)
          earningsByHotelResult = await sql`
            SELECT 
              h.name as hotel_name,
              h.id as hotel_id,
              COALESCE(SUM(o.total_amount), 0) as earnings,
              COUNT(o.id) as order_count
            FROM hotels h
            LEFT JOIN orders o ON h.id = o.hotel_id 
              AND o.status = 'delivered' 
              AND o.order_date >= ${yearStart.toISOString()}
            GROUP BY h.id, h.name
            ORDER BY earnings DESC
          `
          break
        }
        default:
          earningsByHotelResult = await sql`
            SELECT 
              h.name as hotel_name,
              h.id as hotel_id,
              COALESCE(SUM(o.total_amount), 0) as earnings,
              COUNT(o.id) as order_count
            FROM hotels h
            LEFT JOIN orders o ON h.id = o.hotel_id AND o.status = 'delivered'
            GROUP BY h.id, h.name
            ORDER BY earnings DESC
          `
      }
    } else {
      earningsByHotelResult = await sql`
        SELECT 
          h.name as hotel_name,
          h.id as hotel_id,
          COALESCE(SUM(o.total_amount), 0) as earnings,
          COUNT(o.id) as order_count
        FROM hotels h
        LEFT JOIN orders o ON h.id = o.hotel_id AND o.status = 'delivered'
        GROUP BY h.id, h.name
        ORDER BY earnings DESC
      `
    }

    // Get daily earnings for chart (last 30 days or custom range)
    const chartStartDate = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const chartEndDate = endDate ? new Date(endDate) : now

    const dailyEarningsResult = await sql`
      SELECT 
        DATE(order_date) as date,
        COALESCE(SUM(total_amount), 0) as earnings
      FROM orders 
      WHERE status = 'delivered' 
        AND order_date >= ${chartStartDate.toISOString()}
        AND order_date <= ${chartEndDate.toISOString()}
      GROUP BY DATE(order_date)
      ORDER BY date
    `

    const response = {
      totalEarnings: Number.parseFloat(totalEarningsResult[0].total_earnings) || 0,
      earningsByHotel: earningsByHotelResult.map((row) => ({
        hotelName: row.hotel_name,
        hotelId: row.hotel_id,
        earnings: Number.parseFloat(row.earnings) || 0,
        orderCount: Number.parseInt(row.order_count) || 0,
      })),
      dailyEarnings: dailyEarningsResult.map((row) => ({
        date: row.date,
        earnings: Number.parseFloat(row.earnings) || 0,
      })),
      period: period || "custom",
      dateRange: {
        start: startDate || chartStartDate.toISOString().split("T")[0],
        end: endDate || chartEndDate.toISOString().split("T")[0],
      },
    }

    console.log("[v0] Earnings API response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Earnings API error:", error)
    return NextResponse.json({ error: "Failed to fetch earnings data" }, { status: 500 })
  }
}
