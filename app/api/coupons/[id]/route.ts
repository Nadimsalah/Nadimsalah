import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      is_active,
      expires_at,
    } = body

    const updatedCoupon = await sql`
      UPDATE coupons SET
        code = ${code},
        description = ${description},
        discount_type = ${discount_type},
        discount_value = ${discount_value},
        min_order_amount = ${min_order_amount},
        max_discount_amount = ${max_discount_amount},
        usage_limit = ${usage_limit},
        is_active = ${is_active},
        expires_at = ${expires_at},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (updatedCoupon.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ coupon: updatedCoupon[0] })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deletedCoupon = await sql`
      DELETE FROM coupons WHERE id = ${params.id}
      RETURNING *
    `

    if (deletedCoupon.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
