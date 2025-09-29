import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, category, price, stock, description, image } = await request.json()
    const { id } = params
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
      return NextResponse.json({ success: false, error: "User or hotel not found" }, { status: 404 })
    }

    const hotelId = users[0].hotel_id

    const product = await sql`
      UPDATE products 
      SET 
        name = ${name},
        category = ${category},
        price = ${Number.parseFloat(price)},
        in_stock = ${Number.parseInt(stock) > 0},
        description = ${description || ""},
        image_url = ${image || `/placeholder.svg?height=400&width=400&query=${name.toLowerCase()}`},
        updated_at = NOW()
      WHERE id = ${id} AND hotel_id = ${hotelId}
      RETURNING *
    `

    if (product.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: product[0] })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const userId = request.headers.get("x-user-id")

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
      return NextResponse.json({ success: false, error: "User or hotel not found" }, { status: 404 })
    }

    const hotelId = users[0].hotel_id

    const result = await sql`
      DELETE FROM products 
      WHERE id = ${id} AND hotel_id = ${hotelId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}
