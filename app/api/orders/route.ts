import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Orders API POST - Received data:", body)

    const {
      hotelId,
      hotel_slug,
      guestName,
      guest_name,
      roomNumber,
      room_number,
      phoneNumber,
      phone_number,
      items,
      totalAmount,
      total_amount,
      paymentMethod,
      payment_method,
    } = body

    // Normalize field names (support both formats)
    const normalizedGuestName = guestName || guest_name
    const normalizedRoomNumber = roomNumber || room_number
    const normalizedPhoneNumber = phoneNumber || phone_number
    const normalizedTotalAmount = totalAmount || total_amount
    const normalizedPaymentMethod = paymentMethod || payment_method || "cash"

    let finalHotelId = hotelId
    if (!finalHotelId && hotel_slug) {
      console.log("[v0] Orders API: Converting hotel_slug to hotelId:", hotel_slug)

      // Try multiple lookup strategies for hotel slug
      const hotelLookupQueries = [
        sql`SELECT id FROM hotels WHERE slug = ${hotel_slug} LIMIT 1`,
        sql`SELECT id FROM hotels WHERE LOWER(name) = LOWER(${hotel_slug.replace(/-/g, " ")}) LIMIT 1`,
        sql`SELECT id FROM hotels WHERE LOWER(REPLACE(name, ' ', '-')) = LOWER(${hotel_slug}) LIMIT 1`,
      ]

      for (const query of hotelLookupQueries) {
        try {
          const hotelResult = await query
          if (hotelResult.length > 0) {
            finalHotelId = hotelResult[0].id
            console.log("[v0] Orders API: Found hotel ID:", finalHotelId)
            break
          }
        } catch (error) {
          console.log("[v0] Orders API: Hotel lookup query failed:", error)
          continue
        }
      }

      if (!finalHotelId) {
        console.log("[v0] Orders API: Hotel not found for slug:", hotel_slug)
        return NextResponse.json(
          {
            success: false,
            error: "Hotel not found",
            details: `No hotel found for slug: ${hotel_slug}`,
          },
          { status: 404 },
        )
      }
    }

    // Validate required fields
    if (
      !finalHotelId ||
      !normalizedGuestName ||
      !normalizedRoomNumber ||
      !normalizedPhoneNumber ||
      !items ||
      !normalizedTotalAmount
    ) {
      console.log("[v0] Orders API: Missing required fields:", {
        hotelId: finalHotelId,
        guestName: normalizedGuestName,
        roomNumber: normalizedRoomNumber,
        phoneNumber: normalizedPhoneNumber,
        items: items ? "present" : "missing",
        totalAmount: normalizedTotalAmount,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: [
            "hotelId/hotel_slug",
            "guestName/guest_name",
            "roomNumber/room_number",
            "phoneNumber/phone_number",
            "items",
            "totalAmount/total_amount",
          ],
        },
        { status: 400 },
      )
    }

    const orderId = crypto.randomUUID()
    const currentTime = new Date().toISOString()

    console.log("[v0] Orders API: Creating order for hotel ID:", finalHotelId)

    const orderCountResult = await sql`
      SELECT COUNT(*) as count FROM orders WHERE hotel_id = ${finalHotelId}
    `
    const nextOrderNumber = Number.parseInt(orderCountResult[0].count) + 1

    const result = await sql`
      INSERT INTO orders (
        id, 
        hotel_id, 
        guest_name, 
        room_number, 
        phone_number, 
        items, 
        total_amount, 
        order_number,
        status,
        order_date,
        created_at,
        updated_at,
        payment_method
      )
      VALUES (
        ${orderId}, 
        ${finalHotelId}, 
        ${normalizedGuestName}, 
        ${normalizedRoomNumber}, 
        ${normalizedPhoneNumber}, 
        ${JSON.stringify(items)}, 
        ${normalizedTotalAmount}, 
        ${nextOrderNumber},
        'pending',
        ${currentTime},
        ${currentTime},
        ${currentTime},
        ${normalizedPaymentMethod}
      )
      RETURNING *
    `

    console.log("[v0] Orders API: Order created successfully:", result[0])

    return NextResponse.json({
      success: true,
      order: result[0],
      message: "Order placed successfully",
    })
  } catch (error) {
    console.error("[v0] Orders API: Order creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Orders API GET request started")

    const userId = request.headers.get("x-user-id")
    console.log("[v0] Orders API user ID:", userId)

    if (!userId) {
      console.log("[v0] Orders API: No user ID provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] Orders API: Testing database connection...")

    // Test database connection first
    try {
      await sql`SELECT 1 as test`
      console.log("[v0] Orders API: Database connection successful")
    } catch (dbError) {
      console.error("[v0] Orders API: Database connection failed:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 503 },
      )
    }

    console.log("[v0] Orders API: Fetching user hotel...")
    const users = await sql`
      SELECT u.id, h.id as hotel_id 
      FROM users u
      JOIN hotels h ON u.id = h.owner_id
      WHERE u.id = ${userId}
      LIMIT 1
    `
    console.log("[v0] Orders API: User hotel query result:", users)

    if (users.length === 0) {
      console.log("[v0] Orders API: User or hotel not found")
      return NextResponse.json({ success: false, error: "User or hotel not found" }, { status: 404 })
    }

    const hotelId = users[0].hotel_id
    console.log("[v0] Orders API: Hotel ID found:", hotelId)

    console.log("[v0] Orders API: Fetching orders...")
    const orders = await sql`
      SELECT * FROM orders 
      WHERE hotel_id = ${hotelId}
      ORDER BY order_date DESC
    `
    console.log("[v0] Orders API: Orders fetched successfully:", orders.length, "orders")

    console.log("[v0] Orders API response:", { success: true, orders })
    return NextResponse.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error("[v0] Orders fetch error: Error connecting to database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : "UnknownError",
      },
      { status: 500 },
    )
  }
}
