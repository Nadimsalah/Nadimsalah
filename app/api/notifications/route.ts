import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    let notifications
    if (unreadOnly) {
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND is_read = false
        ORDER BY created_at DESC LIMIT 50
      `
    } else {
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 50
      `
    }

    const unreadCount = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} AND is_read = false
    `

    return NextResponse.json({
      notifications,
      unreadCount: Number.parseInt(unreadCount[0].count),
    })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { notificationIds, markAllAsRead } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    if (markAllAsRead) {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${userId} AND is_read = false
      `
    } else if (notificationIds && notificationIds.length > 0) {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = ANY(${notificationIds}) AND user_id = ${userId}
      `
    }

    return NextResponse.json({ message: "Notifications updated successfully" })
  } catch (error) {
    console.error("Notifications update error:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
