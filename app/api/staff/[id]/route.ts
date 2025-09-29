import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    const staffId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { email, password, firstName, lastName, role, serviceIds, isActive } = await request.json()

    // Verify staff belongs to user's hotel
    const staffCheck = await sql`
      SELECT s.id 
      FROM staff s
      JOIN hotels h ON s.hotel_id = h.id
      WHERE s.id = ${staffId} AND h.owner_id = ${userId}
    `

    if (staffCheck.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updates = []
    const values = []

    if (email !== undefined) {
      updates.push(`email = $${updates.length + 1}`)
      values.push(email)
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${updates.length + 1}`)
      values.push(firstName)
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${updates.length + 1}`)
      values.push(lastName)
    }
    if (role !== undefined) {
      updates.push(`role = $${updates.length + 1}`)
      values.push(role)
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${updates.length + 1}`)
      values.push(isActive)
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      updates.push(`password_hash = $${updates.length + 1}`)
      values.push(passwordHash)
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(staffId)

      await sql`
        UPDATE staff 
        SET ${sql.unsafe(updates.join(", "))}
        WHERE id = ${staffId}
      `
    }

    // Update service assignments
    if (serviceIds !== undefined) {
      // Remove existing assignments
      await sql`
        DELETE FROM staff_services WHERE staff_id = ${staffId}
      `

      // Add new assignments
      if (serviceIds.length > 0) {
        for (const serviceId of serviceIds) {
          await sql`
            INSERT INTO staff_services (staff_id, service_id)
            VALUES (${staffId}, ${serviceId})
          `
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    const staffId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify staff belongs to user's hotel
    const staffCheck = await sql`
      SELECT s.id 
      FROM staff s
      JOIN hotels h ON s.hotel_id = h.id
      WHERE s.id = ${staffId} AND h.owner_id = ${userId}
    `

    if (staffCheck.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Delete staff (cascade will handle staff_services)
    await sql`
      DELETE FROM staff WHERE id = ${staffId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 })
  }
}
