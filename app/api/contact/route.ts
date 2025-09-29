import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    try {
      // Create the table with proper constraints and indexes
      await sql`
        CREATE TABLE IF NOT EXISTS contact_requests (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'new',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create index for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at 
        ON contact_requests(created_at DESC)
      `
    } catch (tableError) {
      // Don't continue if table creation fails
      return NextResponse.json({ error: "Database initialization failed. Please try again." }, { status: 503 })
    }

    // Insert contact request into database
    const result = await sql`
      INSERT INTO contact_requests (name, email, message)
      VALUES (${name}, ${email}, ${message})
      RETURNING id, created_at
    `

    return NextResponse.json(
      {
        success: true,
        id: result[0].id,
        created_at: result[0].created_at,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found. Please refresh and try again.",
          },
          { status: 503 },
        )
      }

      if (error.message.includes("connection")) {
        return NextResponse.json(
          {
            error: "Database connection failed. Please try again.",
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to save contact request. Please try again." }, { status: 500 })
  }
}
