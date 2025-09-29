import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("user-id")
    const { status, autoRenew } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Update subscription
    const updatedSubscription = await sql`
      UPDATE user_subscriptions 
      SET 
        status = ${status},
        auto_renew = ${autoRenew},
        updated_at = NOW()
      WHERE id = ${params.id} AND user_id = ${userId}
      RETURNING *
    `

    if (updatedSubscription.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({
      subscription: updatedSubscription[0],
      success: true,
    })
  } catch (error) {
    console.error("Subscription update error:", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    // Cancel subscription
    const cancelledSubscription = await sql`
      UPDATE user_subscriptions 
      SET 
        status = 'cancelled',
        auto_renew = false,
        updated_at = NOW()
      WHERE id = ${params.id} AND user_id = ${userId}
      RETURNING *
    `

    if (cancelledSubscription.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({
      subscription: cancelledSubscription[0],
      success: true,
    })
  } catch (error) {
    console.error("Subscription cancellation error:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
