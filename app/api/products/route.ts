import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user's hotel_id
    const users = await sql`
      SELECT u.id, h.id as hotel_id 
      FROM users u
      JOIN hotels h ON u.id = h.owner_id
      WHERE u.id = ${userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "User or hotel not found" }, { status: 404 })
    }

    const hotelId = users[0].hotel_id

    const products = await sql`
      SELECT * FROM products 
      WHERE hotel_id = ${hotelId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category, price, stock, description, image, video } = await request.json()
    const userId = request.headers.get("x-user-id")

    // Validation
    if (!name || !category || !price || stock === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const users = await sql`
      SELECT u.id, h.id as hotel_id 
      FROM users u
      JOIN hotels h ON u.id = h.owner_id
      WHERE u.id = ${userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "User or hotel not found. Please create an account first." },
        { status: 400 },
      )
    }

    const hotelId = users[0].hotel_id

    const product = await sql`
      INSERT INTO products (id, name, category, price, in_stock, description, image_url, video_url, hotel_id, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${name}, 
        ${category}, 
        ${Number.parseFloat(price)}, 
        ${Number.parseInt(stock) > 0},
        ${description || ""}, 
        ${image || `/placeholder.svg?height=400&width=400&query=${name.toLowerCase()}`},
        ${video || null},
        ${hotelId},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, product: product[0] })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}
