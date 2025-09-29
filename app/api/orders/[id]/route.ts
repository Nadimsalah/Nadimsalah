import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body
    const orderId = params.id
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Validate status
    const validStatuses = ["pending", "preparing", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const users = await sql`
      SELECT u.id, h.id as hotel_id 
      FROM users u
      JOIN hotels h ON u.id = h.owner_id
      WHERE u.id = ${userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "User or hotel not found" }, { status: 404 })
    }

    const hotelId = users[0].hotel_id

    const result = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        delivery_time = ${status === "delivered" ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${orderId} AND hotel_id = ${hotelId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: result[0],
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
