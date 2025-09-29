import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment intent ID required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Rolling back payment:", paymentIntentId)

    const result = await sql`
      UPDATE subscription_payments 
      SET 
        payment_status = 'cancelled',
        updated_at = NOW()
      WHERE transaction_id = ${paymentIntentId}
      RETURNING *
    `

    if (result.length === 0) {
      console.log("[v0] Payment not found for rollback:", paymentIntentId)
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found",
        },
        { status: 404 },
      )
    }

    console.log("[v0] Payment rolled back successfully:", result[0])

    // For now, we just mark it as cancelled in our database

    return NextResponse.json({
      success: true,
      message: "Payment rolled back successfully",
      payment: result[0],
    })
  } catch (error) {
    console.error("[v0] Payment rollback error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to rollback payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
