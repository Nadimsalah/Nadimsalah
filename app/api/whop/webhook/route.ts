/**
 * Whop Webhook Handler
 *
 * Endpoint: POST https://hoteltec.app/api/whop/webhook
 * Secret: ws_5f4f26266a85447dcc49b562b715f467723556d449c414312104a092066c66e7
 *
 * Events handled:
 * - checkout.completed
 * - subscription.created
 * - subscription.renewed
 * - subscription.canceled
 * - refund.processed
 */

import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)
const WEBHOOK_SECRET =
  process.env.WHOP_WEBHOOK_SECRET || "ws_5f4f26266a85447dcc49b562b715f467723556d449c414312104a092066c66e7"

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex")
    const bufB = Buffer.from(b, "hex")
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function verifySignature(body: string, signature: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex")

  return timingSafeEqual(expectedSignature, signature)
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("whop-signature") || request.headers.get("x-whop-signature") || ""

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error("[v0] Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log("[v0] Webhook event received:", event.type)

    switch (event.type) {
      case "checkout.completed": {
        const { plan_id, receipt_id, customer, amount, currency } = event.data || {}

        console.log("[v0] Processing checkout.completed:", { plan_id, receipt_id })

        // Insert or update subscription
        await sql`
          INSERT INTO subscriptions (
            receipt_id, 
            plan_id, 
            customer_email, 
            customer_name,
            customer_id,
            amount,
            currency,
            status,
            subscription_type
          )
          VALUES (
            ${receipt_id},
            ${plan_id},
            ${customer?.email || null},
            ${customer?.name || null},
            ${customer?.id || null},
            ${amount || null},
            ${currency || "USD"},
            'active',
            ${plan_id?.includes("6m") ? "6-month" : "12-month"}
          )
          ON CONFLICT (receipt_id) 
          DO UPDATE SET
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        `

        console.log("[v0] Subscription provisioned successfully")
        break
      }

      case "subscription.created": {
        const { plan_id, receipt_id, customer } = event.data || {}
        console.log("[v0] Subscription created:", { plan_id, receipt_id })

        await sql`
          UPDATE subscriptions
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE receipt_id = ${receipt_id}
        `
        break
      }

      case "subscription.renewed": {
        const { receipt_id, expires_at } = event.data || {}
        console.log("[v0] Subscription renewed:", receipt_id)

        await sql`
          UPDATE subscriptions
          SET 
            status = 'active',
            expires_at = ${expires_at || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE receipt_id = ${receipt_id}
        `
        break
      }

      case "subscription.canceled": {
        const { receipt_id } = event.data || {}
        console.log("[v0] Subscription canceled:", receipt_id)

        await sql`
          UPDATE subscriptions
          SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
          WHERE receipt_id = ${receipt_id}
        `
        break
      }

      case "refund.processed": {
        const { receipt_id } = event.data || {}
        console.log("[v0] Refund processed:", receipt_id)

        await sql`
          UPDATE subscriptions
          SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
          WHERE receipt_id = ${receipt_id}
        `
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
