import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const tickets = await sql`
      SELECT 
        st.*,
        COUNT(tc.id) as comment_count
      FROM support_tickets st
      LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
      WHERE st.user_id = ${userId}
      GROUP BY st.id
      ORDER BY st.created_at DESC
    `

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Support tickets fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const { subject, description, priority = "medium", attachments = [] } = await request.json()

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 })
    }

    const userResult = await sql`
      SELECT hotel_name FROM users WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      console.error("[v0] User not found:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const hotelResult = await sql`
      SELECT id FROM hotels WHERE owner_id = ${userId}
    `

    if (hotelResult.length === 0) {
      console.error("[v0] Hotel not found for user:", userId)
      return NextResponse.json({ error: "Hotel not found for user" }, { status: 404 })
    }

    const hotelId = hotelResult[0].id

    const ticketResult = await sql`
      INSERT INTO support_tickets (user_id, hotel_id, subject, description, priority)
      VALUES (${userId}, ${hotelId}, ${subject}, ${description}, ${priority})
      RETURNING *
    `

    const ticket = ticketResult[0]
    console.log("[v0] Ticket created:", ticket.id)

    if (attachments && attachments.length > 0) {
      console.log("[v0] Processing attachments:", attachments.length)
      for (const attachment of attachments) {
        try {
          await sql`
            INSERT INTO ticket_attachments (ticket_id, file_name, file_url, file_size, file_type, uploaded_by)
            VALUES (${ticket.id}, ${attachment.fileName}, ${attachment.fileUrl}, ${attachment.fileSize}, ${attachment.fileType}, ${userId})
          `
          console.log("[v0] Attachment saved:", attachment.fileName)
        } catch (attachmentError) {
          console.error("[v0] Error saving attachment:", attachment.fileName, attachmentError)
          // Continue with other attachments even if one fails
        }
      }
    }

    console.log("[v0] Looking for super admin users...")
    const superAdmins = await sql`
      SELECT id FROM users WHERE role = 'super_admin'
    `

    console.log(`[v0] Found ${superAdmins.length} super admin users:`, superAdmins)

    if (superAdmins.length === 0) {
      console.log(
        "[v0] No super admin users found, creating notification for user ID 'd894a925-f367-487a-9b1f-76dd476be21c' as fallback",
      )
      // Create notification for the main user as fallback
      await sql`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (
          'd894a925-f367-487a-9b1f-76dd476be21c', 
          'support_ticket', 
          'New Support Ticket Created', 
          ${`Your ${priority} priority ticket: ${subject} has been created`},
          ${ticket.id}
        )
      `
    } else {
      for (const admin of superAdmins) {
        console.log(`[v0] Creating notification for super admin: ${admin.id}`)
        await sql`
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (
            ${admin.id}, 
            'support_ticket', 
            'New Support Ticket', 
            ${`New ${priority} priority ticket: ${subject} from ${userResult[0].hotel_name}`},
            ${ticket.id}
          )
        `
      }
    }

    console.log("[v0] Support ticket created successfully with notifications")

    return NextResponse.json({
      message: "Support ticket created successfully",
      ticket,
    })
  } catch (error) {
    console.error("[v0] Support ticket creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create support ticket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
