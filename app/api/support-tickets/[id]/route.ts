import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("user-id")
    const ticketId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const ticketResult = await sql`
      SELECT * FROM support_tickets 
      WHERE id = ${ticketId} AND user_id = ${userId}
    `

    if (ticketResult.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketResult[0]

    const comments = await sql`
      SELECT 
        tc.*,
        u.first_name,
        u.last_name,
        u.role
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ${ticketId}
      ORDER BY tc.created_at ASC
    `

    const attachments = await sql`
      SELECT * FROM ticket_attachments 
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      ticket,
      comments,
      attachments,
    })
  } catch (error) {
    console.error("Support ticket fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch support ticket" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("user-id")
    const ticketId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const { comment } = await request.json()

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const ticketResult = await sql`
      SELECT id FROM support_tickets 
      WHERE id = ${ticketId} AND user_id = ${userId}
    `

    if (ticketResult.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const commentResult = await sql`
      INSERT INTO ticket_comments (ticket_id, user_id, comment, is_admin_response)
      VALUES (${ticketId}, ${userId}, ${comment}, false)
      RETURNING *
    `

    return NextResponse.json({
      message: "Comment added successfully",
      comment: commentResult[0],
    })
  } catch (error) {
    console.error("Support ticket comment error:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
