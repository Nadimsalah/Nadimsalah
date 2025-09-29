import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 401 })
    }

    // Get user's hotel_id
    const hotels = await sql`
      SELECT id FROM hotels WHERE owner_id = ${userId} LIMIT 1
    `

    if (hotels.length === 0) {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 })
    }

    const hotelId = hotels[0].id

    // Get unique categories for this hotel's products
    const categories = await sql`
      SELECT DISTINCT category FROM products 
      WHERE hotel_id = ${hotelId} AND category IS NOT NULL AND category != ''
      ORDER BY category
    `

    return NextResponse.json({
      success: true,
      categories: categories.map((row) => row.category),
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 401 })
    }

    const { category } = await request.json()

    if (!category || !category.trim()) {
      return NextResponse.json({ success: false, error: "Category name required" }, { status: 400 })
    }

    // Get user's hotel_id
    const hotels = await sql`
      SELECT id FROM hotels WHERE owner_id = ${userId} LIMIT 1
    `

    if (hotels.length === 0) {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 })
    }

    const hotelId = hotels[0].id

    // We'll insert a minimal product entry that serves as a category placeholder
    await sql`
      INSERT INTO products (hotel_id, name, category, price, stock, description, in_stock, created_at, updated_at)
      VALUES (${hotelId}, '__CATEGORY_PLACEHOLDER__', ${category.trim()}, 0, 0, 'Category placeholder - will be removed when real products are added', false, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({ success: true, category: category.trim() })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 })
  }
}
