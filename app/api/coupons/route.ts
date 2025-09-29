import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const coupons = await sql`
      SELECT 
        id,
        code,
        discount_type,
        discount_value,
        max_uses,
        current_uses,
        is_active,
        expires_at,
        created_at,
        updated_at
      FROM coupons 
      ORDER BY created_at DESC
    `

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    if (error instanceof Error && error.message.includes('relation "coupons" does not exist')) {
      console.log("[v0] Coupons table doesn't exist yet, returning empty array")
      return NextResponse.json({ coupons: [] })
    }
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, discount_type, discount_value, max_uses, expires_at } = body

    // Validate required fields
    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      // Check if coupon code already exists
      const existingCoupon = await sql`
        SELECT id FROM coupons WHERE code = ${code}
      `

      if (existingCoupon.length > 0) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
      }

      const newCoupon = await sql`
        INSERT INTO coupons (
          code, discount_type, discount_value, max_uses, expires_at
        ) VALUES (
          ${code}, ${discount_type}, ${discount_value}, ${max_uses}, ${expires_at}
        )
        RETURNING *
      `

      return NextResponse.json({ coupon: newCoupon[0] }, { status: 201 })
    } catch (dbError) {
      if (dbError instanceof Error && dbError.message.includes('relation "coupons" does not exist')) {
        console.log("[v0] Coupons table doesn't exist yet, cannot create coupon")
        return NextResponse.json(
          {
            error: "Coupon system not initialized. Please run the database migration first.",
          },
          { status: 503 },
        )
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
