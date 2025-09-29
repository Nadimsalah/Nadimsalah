import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")

    let tickets
    if (status && priority && search) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.status = ${status} AND st.priority = ${priority} 
        AND (st.subject ILIKE ${`%${search}%`} OR st.description ILIKE ${`%${search}%`})
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (status && priority) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.status = ${status} AND st.priority = ${priority}
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (status && search) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.status = ${status} 
        AND (st.subject ILIKE ${`%${search}%`} OR st.description ILIKE ${`%${search}%`})
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (priority && search) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.priority = ${priority} 
        AND (st.subject ILIKE ${`%${search}%`} OR st.description ILIKE ${`%${search}%`})
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (status) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.status = ${status}
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (priority) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.priority = ${priority}
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else if (search) {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.subject ILIKE ${`%${search}%`} OR st.description ILIKE ${`%${search}%`}
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    } else {
      tickets = await sql`
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          h.name as hotel_name,
          COUNT(tc.id) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        JOIN hotels h ON st.hotel_id = h.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        GROUP BY st.id, u.first_name, u.last_name, u.email, h.name 
        ORDER BY st.created_at DESC
      `
    }

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
      FROM support_tickets
    `

    return NextResponse.json({ tickets, stats: stats[0] })
  } catch (error) {
    console.error("Super admin support tickets fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 })
  }
}
