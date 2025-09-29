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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get users with their hotel information
    let query = sql`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        h.id as hotel_id,
        h.name as hotel_name,
        (SELECT COUNT(*) FROM orders WHERE hotel_id = h.id) as order_count,
        (SELECT COUNT(*) FROM products WHERE hotel_id = h.id) as product_count
      FROM users u
      LEFT JOIN hotels h ON u.id = h.owner_id
      WHERE u.role = 'hotel_owner'
    `

    if (search) {
      query = sql`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.created_at,
          u.updated_at,
          h.id as hotel_id,
          h.name as hotel_name,
          (SELECT COUNT(*) FROM orders WHERE hotel_id = h.id) as order_count,
          (SELECT COUNT(*) FROM products WHERE hotel_id = h.id) as product_count
        FROM users u
        LEFT JOIN hotels h ON u.id = h.owner_id
        WHERE u.role = 'hotel_owner'
        AND (
          u.first_name ILIKE ${`%${search}%`} OR
          u.last_name ILIKE ${`%${search}%`} OR
          u.email ILIKE ${`%${search}%`} OR
          h.name ILIKE ${`%${search}%`}
        )
      `
    }

    const users = await sql`
      ${query}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const totalResult = await sql`
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN hotels h ON u.id = h.owner_id
      WHERE u.role = 'hotel_owner'
      ${
        search
          ? sql`AND (
        u.first_name ILIKE ${`%${search}%`} OR
        u.last_name ILIKE ${`%${search}%`} OR
        u.email ILIKE ${`%${search}%`} OR
        h.name ILIKE ${`%${search}%`}
      )`
          : sql``
      }
    `

    return NextResponse.json({
      success: true,
      users: users,
      pagination: {
        page: page,
        limit: limit,
        total: Number.parseInt(totalResult[0].total),
        pages: Math.ceil(Number.parseInt(totalResult[0].total) / limit),
      },
    })
  } catch (error) {
    console.error("Super admin users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
