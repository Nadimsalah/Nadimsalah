import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/bookings - Retrieve all bookings
export async function GET(request: NextRequest) {
  try {
    const bookings = await sql`
      SELECT * FROM bookings 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      data: bookings,
    })
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bookings",
      },
      { status: 500 },
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guest_name, email, room_type, check_in, check_out, guests } = body

    // Validate required fields
    if (!guest_name || !email || !room_type || !check_in || !check_out) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO bookings (guest_name, email, room_type, check_in, check_out, guests, status)
      VALUES (${guest_name}, ${email}, ${room_type}, ${check_in}, ${check_out}, ${guests || 1}, 'pending')
      RETURNING *
    `

    return NextResponse.json(
      {
        success: true,
        data: result[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating booking:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking. Please check your connection and try again.",
      },
      { status: 500 },
    )
  }
}
