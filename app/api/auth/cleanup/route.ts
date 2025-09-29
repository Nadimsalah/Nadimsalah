import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Cleaning up user account:", userId)

    await sql`DELETE FROM user_subscriptions WHERE user_id = ${userId}`
    await sql`DELETE FROM subscription_payments WHERE user_id = ${userId}`
    await sql`DELETE FROM hotels WHERE owner_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`

    console.log("[v0] User account cleaned up successfully:", userId)

    return NextResponse.json({
      success: true,
      message: "User account cleaned up successfully",
    })
  } catch (error) {
    console.error("[v0] Account cleanup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
