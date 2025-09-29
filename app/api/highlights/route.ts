import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotelId")
    const userId = request.headers.get("x-user-id")

    if (!hotelId && !userId) {
      return NextResponse.json({ error: "Hotel ID or User ID is required" }, { status: 400 })
    }

    let highlights
    if (hotelId) {
      // Public access for store
      highlights = await sql`
        SELECT 
          h.*,
          COUNT(sh.story_id) as story_count
        FROM highlights h
        LEFT JOIN story_highlights sh ON h.id = sh.highlight_id
        LEFT JOIN stories s ON sh.story_id = s.id AND s.is_active = true
        WHERE h.hotel_id = ${hotelId} AND h.is_active = true
        GROUP BY h.id
        ORDER BY h.sort_order, h.created_at
      `
    } else {
      // Admin access
      const userHotel = await sql`
        SELECT h.id FROM hotels h WHERE h.owner_id = ${userId}
      `

      if (userHotel.length === 0) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
      }

      highlights = await sql`
        SELECT 
          h.*,
          COUNT(sh.story_id) as story_count
        FROM highlights h
        LEFT JOIN story_highlights sh ON h.id = sh.highlight_id
        LEFT JOIN stories s ON sh.story_id = s.id AND s.is_active = true
        WHERE h.hotel_id = ${userHotel[0].id}
        GROUP BY h.id
        ORDER BY h.sort_order, h.created_at
      `
    }

    return NextResponse.json({ highlights })
  } catch (error: any) {
    if (!error.message?.includes('relation "highlights" does not exist')) {
      console.error("Highlights API error:", error)
    }

    if (error.message?.includes('relation "highlights" does not exist')) {
      return NextResponse.json({
        highlights: [
          {
            id: "demo-1",
            title: "Welcome",
            description: "Welcome to our hotel",
            story_count: 2,
            cover_image: "/hotel-welcome.png",
            is_active: true,
            sort_order: 1,
          },
          {
            id: "demo-2",
            title: "Rooms",
            description: "Our beautiful rooms",
            story_count: 3,
            cover_image: "/comfortable-hotel-room.png",
            is_active: true,
            sort_order: 2,
          },
          {
            id: "demo-3",
            title: "Dining",
            description: "Delicious dining experiences",
            story_count: 4,
            cover_image: "/hotel-restaurant.png",
            is_active: true,
            sort_order: 3,
          },
          {
            id: "demo-4",
            title: "Amenities",
            description: "Hotel facilities",
            story_count: 2,
            cover_image: "/hotel-spa.png",
            is_active: true,
            sort_order: 4,
          },
        ],
        message: "Demo highlights - database migration needed for full functionality",
      })
    }

    return NextResponse.json({ error: "Failed to fetch highlights" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { title, description, cover_image } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Get user's hotel
    const userHotel = await sql`
      SELECT h.id FROM hotels h WHERE h.owner_id = ${userId}
    `

    if (userHotel.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    // Get next sort order
    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), 0) as max_order 
      FROM highlights 
      WHERE hotel_id = ${userHotel[0].id}
    `

    const highlight = await sql`
      INSERT INTO highlights (hotel_id, title, description, cover_image, sort_order, created_by)
      VALUES (${userHotel[0].id}, ${title}, ${description || null}, ${cover_image || null}, ${maxOrder[0].max_order + 1}, ${userId})
      RETURNING *
    `

    return NextResponse.json({ highlight: highlight[0] })
  } catch (error: any) {
    if (!error.message?.includes('relation "highlights" does not exist')) {
      console.error("Highlight creation error:", error)
    }

    if (error.message?.includes('relation "highlights" does not exist')) {
      return NextResponse.json(
        {
          error: "Highlights feature requires database setup. Please run the database migration script.",
          success: false,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: "Failed to create highlight" }, { status: 500 })
  }
}
