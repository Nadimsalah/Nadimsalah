import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id

    const ticketResult = await sql`
      SELECT 
        st.*,
        u.first_name,
        u.last_name,
        u.email,
        h.name as hotel_name
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
      JOIN hotels h ON st.hotel_id = h.id
      WHERE st.id = ${ticketId}
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
    console.error("Super admin support ticket fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch support ticket" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id
    const { status, adminComment, adminUserId } = await request.json()

    if (status) {
      await sql`
        UPDATE support_tickets 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${ticketId}
      `
    }

    if (adminComment && adminUserId) {
      await sql`
        INSERT INTO ticket_comments (ticket_id, user_id, comment, is_admin_response)
        VALUES (${ticketId}, ${adminUserId}, ${adminComment}, true)
      `
    }

    return NextResponse.json({ message: "Ticket updated successfully" })
  } catch (error) {
    console.error("Super admin support ticket update error:", error)
    return NextResponse.json({ error: "Failed to update support ticket" }, { status: 500 })
  }
}
