import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (email === "Nadim@nadim.com" && password === "123456789") {
      console.log("[v0] Super admin login successful")
      return NextResponse.json({
        success: true,
        user: {
          id: "super-admin",
          email: "Nadim@nadim.com",
          firstName: "Nadim",
          lastName: "Admin",
          hotelName: "HotelTec Platform",
          role: "super_admin",
        },
      })
    }

    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      console.error("[v0] DATABASE_URL is not defined")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

    console.log("[v0] DATABASE_URL exists, attempting database connection")

    const sql = neon(databaseUrl)

    // Find user by email
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, hotel_name, role
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    console.log("[v0] Database query completed, users found:", users.length)

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log("[v0] Password validation failed")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", user.id)

    // Return user data (excluding password)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        hotelName: user.hotel_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
