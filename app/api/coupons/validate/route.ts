import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderAmount = 0 } = body

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    // Find the coupon
    const coupon = await sql`
      SELECT * FROM coupons 
      WHERE code = ${code} AND is_active = true
    `

    if (coupon.length === 0) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 })
    }

    const couponData = coupon[0]

    // Check if coupon is expired
    if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 })
    }

    // Check usage limit (using max_uses and current_uses instead of usage_limit and used_count)
    if (couponData.max_uses && couponData.current_uses >= couponData.max_uses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    if (couponData.discount_type === "percentage") {
      discountAmount = (orderAmount * couponData.discount_value) / 100
    } else {
      discountAmount = couponData.discount_value
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount)

    return NextResponse.json({
      valid: true,
      coupon: couponData,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 })
  }
}
