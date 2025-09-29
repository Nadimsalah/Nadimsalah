import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching payment gateways data")

    // Get all payment gateways with hotel information
    const gateways = await sql`
      SELECT 
        pg.id,
        pg.hotel_id,
        pg.gateway_type,
        pg.is_enabled,
        pg.webhook_url,
        pg.created_at,
        pg.updated_at,
        h.name as hotel_name
      FROM payment_gateways pg
      LEFT JOIN hotels h ON pg.hotel_id = h.id
      ORDER BY pg.created_at DESC
    `

    // Get payment statistics
    const stats = await sql`
      SELECT 
        gateway_type,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
      FROM payment_transactions
      GROUP BY gateway_type
    `

    // Get recent transactions
    const recentTransactions = await sql`
      SELECT 
        pt.id,
        pt.transaction_id,
        pt.amount,
        pt.currency,
        pt.status,
        pt.gateway_type,
        pt.created_at,
        h.name as hotel_name,
        o.guest_name,
        o.room_number
      FROM payment_transactions pt
      LEFT JOIN hotels h ON pt.hotel_id = h.id
      LEFT JOIN orders o ON pt.order_id = o.id
      ORDER BY pt.created_at DESC
      LIMIT 10
    `

    console.log("[v0] Payment gateways data fetched successfully")

    return NextResponse.json({
      gateways,
      stats,
      recentTransactions,
    })
  } catch (error) {
    console.error("[v0] Payment gateways fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch payment gateways data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hotel_id, gateway_type, is_enabled, api_key, secret_key, webhook_url, settings } = body

    console.log("[v0] Creating/updating payment gateway:", { hotel_id, gateway_type })

    const result = await sql`
      INSERT INTO payment_gateways (hotel_id, gateway_type, is_enabled, api_key, secret_key, webhook_url, settings, updated_at)
      VALUES (${hotel_id}, ${gateway_type}, ${is_enabled}, ${api_key}, ${secret_key}, ${webhook_url}, ${JSON.stringify(settings)}, NOW())
      ON CONFLICT (hotel_id, gateway_type)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        api_key = EXCLUDED.api_key,
        secret_key = EXCLUDED.secret_key,
        webhook_url = EXCLUDED.webhook_url,
        settings = EXCLUDED.settings,
        updated_at = NOW()
      RETURNING *
    `

    console.log("[v0] Payment gateway saved successfully")

    return NextResponse.json({ success: true, gateway: result[0] })
  } catch (error) {
    console.error("[v0] Payment gateway save error:", error)
    return NextResponse.json({ error: "Failed to save payment gateway" }, { status: 500 })
  }
}
