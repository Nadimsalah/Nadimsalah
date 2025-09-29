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

    // Get all hotels with their owner information and stats
    const hotels = await sql`
      SELECT 
        h.id,
        h.name,
        h.description,
        h.logo_url,
        h.contact_number,
        h.address,
        h.facebook_url,
        h.instagram_url,
        h.twitter_url,
        h.linkedin_url,
        h.created_at,
        h.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.created_at as owner_created_at,
        (SELECT COUNT(*) FROM products WHERE hotel_id = h.id) as product_count,
        (SELECT COUNT(*) FROM orders WHERE hotel_id = h.id) as order_count,
        (SELECT COUNT(*) FROM stories WHERE hotel_id = h.id AND is_active = true) as story_count
      FROM hotels h
      LEFT JOIN users u ON h.owner_id = u.id
      ORDER BY h.created_at DESC
    `

    return NextResponse.json({
      success: true,
      hotels: hotels,
      total: hotels.length,
    })
  } catch (error) {
    console.error("Super admin hotels fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
