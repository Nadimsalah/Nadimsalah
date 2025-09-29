import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    try {
      const staff = await sql`
        SELECT 
          s.id,
          s.email,
          s.first_name,
          s.last_name,
          s.role,
          s.is_active,
          s.created_at,
          COALESCE(
            JSON_AGG(
              CASE WHEN srv.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', srv.id,
                  'name', srv.name,
                  'category', srv.category,
                  'icon', srv.icon
                )
              END
            ) FILTER (WHERE srv.id IS NOT NULL), 
            '[]'
          ) as assigned_services
        FROM staff s
        JOIN hotels h ON s.hotel_id = h.id
        LEFT JOIN staff_services ss ON s.id = ss.staff_id
        LEFT JOIN services srv ON ss.service_id = srv.id
        WHERE h.owner_id = ${userId}
        GROUP BY s.id, s.email, s.first_name, s.last_name, s.role, s.is_active, s.created_at
        ORDER BY s.created_at DESC
      `

      return NextResponse.json({ staff })
    } catch (dbError: any) {
      // Handle case where staff table doesn't exist yet
      if (dbError.message?.includes('relation "staff" does not exist')) {
        console.log("Staff table doesn't exist yet, returning empty array")
        return NextResponse.json({ staff: [] })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { email, password, firstName, lastName, role, serviceIds } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    try {
      // Get hotel ID
      const hotelResult = await sql`
        SELECT id FROM hotels WHERE owner_id = ${userId}
      `

      if (hotelResult.length === 0) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
      }

      const hotelId = hotelResult[0].id

      // Check if email already exists
      const existingStaff = await sql`
        SELECT id FROM staff WHERE email = ${email}
      `

      if (existingStaff.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create staff account
      const staffResult = await sql`
        INSERT INTO staff (hotel_id, email, password_hash, first_name, last_name, role)
        VALUES (${hotelId}, ${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role || "staff"})
        RETURNING id
      `

      const staffId = staffResult[0].id

      // Assign services to staff
      if (serviceIds && serviceIds.length > 0) {
        for (const serviceId of serviceIds) {
          await sql`
            INSERT INTO staff_services (staff_id, service_id)
            VALUES (${staffId}, ${serviceId})
          `
        }
      }

      return NextResponse.json({ success: true, staffId })
    } catch (dbError: any) {
      // Handle case where staff table doesn't exist yet
      if (dbError.message?.includes('relation "staff" does not exist')) {
        console.log("Staff table doesn't exist yet, cannot create staff account")
        return NextResponse.json(
          {
            error: "Staff management is not available yet. Please run the database migration first.",
          },
          { status: 503 },
        )
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 })
  }
}
