import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("logo") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Convert file to base64 for storage (in a real app, you'd upload to a cloud service)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Verify user owns the hotel
    const hotels = await sql`
      SELECT h.id FROM hotels h 
      WHERE h.owner_id = ${userId}
      LIMIT 1
    `

    if (hotels.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    return NextResponse.json({
      logoUrl: dataUrl,
      url: dataUrl, // Keep both for compatibility
      message: "Logo uploaded successfully",
    })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
