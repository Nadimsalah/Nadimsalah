import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Checkout API called")
    let body
    try {
      body = await request.json()
      console.log("[v0] Request body parsed:", JSON.stringify(body, null, 2))
    } catch (error) {
      console.log("[v0] JSON parsing error:", error)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const {
      type, // 'subscription' | 'hotel_order'
      planId,
      userInfo,
      hotelId,
      items,
      couponId,
      paymentMethod = "stripe",
      whopPaymentData,
    } = body

    console.log("[v0] Checkout type:", type)
    console.log("[v0] User info:", userInfo)

    if (whopPaymentData) {
      console.log("[v0] Whop payment data received:", whopPaymentData)
    }

    if (type === "subscription") {
      try {
        console.log("[v0] Processing subscription checkout")

        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${userInfo.email}
        `

        if (existingUser.length > 0) {
          console.log("[v0] Email already exists")
          return NextResponse.json(
            { success: false, error: "An account with this email already exists" },
            { status: 409 },
          )
        }

        const planResult = await sql`
          SELECT * FROM subscription_plans WHERE id = ${planId}
        `

        if (planResult.length === 0) {
          console.log("[v0] Plan not found")
          return NextResponse.json({ success: false, error: "Invalid subscription plan" }, { status: 404 })
        }

        const plan = planResult[0]
        let finalAmount = plan.price
        console.log("[v0] Plan found:", plan.name, "Price:", plan.price)

        if (couponId) {
          console.log("[v0] Applying coupon:", couponId)
          try {
            const couponResult = await sql`
              SELECT * FROM coupons 
              WHERE code = ${couponId} 
              AND is_active = true 
              AND (expires_at IS NULL OR expires_at > NOW())
            `

            if (couponResult.length > 0) {
              const coupon = couponResult[0]
              console.log("[v0] Coupon found:", coupon)
              if (coupon.discount_type === "percentage") {
                finalAmount = plan.price * (1 - coupon.discount_value / 100)
              } else {
                finalAmount = Math.max(0, plan.price - coupon.discount_value)
              }
              console.log("[v0] Final amount after coupon:", finalAmount)
            }
          } catch (couponError) {
            console.error("[v0] Coupon validation error:", couponError)
          }
        }

        console.log("[v0] Hashing password...")
        const hashedPassword = await bcrypt.hash(userInfo.password || "default_password_123", 10)
        console.log("[v0] Password hashed successfully")

        console.log("[v0] Creating user with data:", {
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          hotelName: userInfo.hotelName,
        })

        const userResult = await sql`
          INSERT INTO users (
            email, 
            password_hash, 
            first_name, 
            last_name,
            hotel_name,
            role,
            created_at,
            updated_at
          )
          VALUES (
            ${userInfo.email},
            ${hashedPassword},
            ${userInfo.firstName || ""},
            ${userInfo.lastName || ""},
            ${userInfo.hotelName || `${userInfo.firstName || "Hotel"} Store`},
            'hotel_owner',
            NOW(),
            NOW()
          )
          RETURNING *
        `

        console.log("[v0] User created successfully:", userResult[0].id)
        const user = userResult[0]

        const baseSlug = userInfo.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
        const timestamp = Date.now()
        const uniqueSlug = `${baseSlug}-${timestamp}`

        console.log("[v0] Creating hotel with slug:", uniqueSlug)
        const hotelResult = await sql`
          INSERT INTO hotels (
            owner_id,
            name,
            slug,
            contact_number,
            address,
            city,
            country,
            currency,
            store_color,
            created_at,
            updated_at
          )
          VALUES (
            ${user.id},
            ${userInfo.hotelName || `${userInfo.firstName || "Hotel"} Store`},
            ${uniqueSlug},
            ${userInfo.phone || ""},
            ${userInfo.address || ""},
            ${userInfo.city || ""},
            ${userInfo.country || "Morocco"},
            ${userInfo.currency || "MAD"},
            '#8B5CF6',
            NOW(),
            NOW()
          )
          RETURNING *
        `

        console.log("[v0] Hotel created successfully:", hotelResult[0].id)
        const hotel = hotelResult[0]

        console.log("[v0] Creating subscription...")
        const subscriptionResult = await sql`
          INSERT INTO user_subscriptions (
            user_id,
            plan_id,
            status,
            start_date,
            end_date,
            payment_method,
            auto_renew,
            created_at,
            updated_at
          )
          VALUES (
            ${user.id},
            ${planId},
            ${finalAmount === 0 ? "active" : "active"},
            NOW(),
            NOW() + INTERVAL '${plan.duration_months} months',
            ${paymentMethod},
            true,
            NOW(),
            NOW()
          )
          RETURNING *
        `

        console.log("[v0] Subscription created successfully:", subscriptionResult[0].id)
        const subscription = subscriptionResult[0]

        console.log("[v0] Updating user with subscription ID...")
        await sql`
          UPDATE users 
          SET current_subscription_id = ${subscription.id}, updated_at = NOW()
          WHERE id = ${user.id}
        `

        if (whopPaymentData && finalAmount > 0) {
          console.log("[v0] Storing Whop payment record...")
          await sql`
            INSERT INTO subscription_payments (
              subscription_id,
              user_id,
              amount,
              currency,
              payment_method,
              payment_status,
              transaction_id,
              created_at
            )
            VALUES (
              ${subscription.id},
              ${user.id},
              ${finalAmount},
              'USD',
              'whop',
              'completed',
              ${whopPaymentData.id || whopPaymentData.transactionId || `whop_${Date.now()}`},
              NOW()
            )
          `
          console.log("[v0] Whop payment record stored successfully")
        }

        console.log("[v0] Adding default products...")
        try {
          await sql`
            INSERT INTO products (hotel_id, name, description, price, category, in_stock, created_at, updated_at)
            VALUES 
              (${hotel.id}, 'Welcome Drink', 'Complimentary welcome beverage', 0, 'Beverages', true, NOW(), NOW()),
              (${hotel.id}, 'Room Service', 'In-room dining service', 25, 'Services', true, NOW(), NOW()),
              (${hotel.id}, 'Towel Set', 'Fresh towel replacement', 10, 'Amenities', true, NOW(), NOW())
          `
          console.log("[v0] Default products added successfully")
        } catch (productError) {
          console.error("[v0] Error adding default products:", productError)
        }

        console.log("[v0] Subscription checkout completed successfully")
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          hotel: {
            id: hotel.id,
            name: hotel.name,
            slug: hotel.slug,
          },
          subscription: {
            id: subscription.id,
            planId: subscription.plan_id,
            status: subscription.status,
            amount: finalAmount,
          },
          checkout: {
            type: "subscription",
            planId,
            planName: plan.name,
            originalAmount: plan.price,
            finalAmount,
            requiresPayment: finalAmount > 0,
          },
        })
      } catch (dbError) {
        console.error("[v0] Database error in subscription checkout:", dbError)
        const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error"
        console.error("[v0] Error details:", errorMessage)
        return NextResponse.json(
          {
            success: false,
            error: "Database error during subscription processing",
            details: errorMessage,
          },
          { status: 500 },
        )
      }
    } else if (type === "hotel_order") {
      try {
        const hotelResult = await sql`
          SELECT id, name FROM hotels WHERE id = ${hotelId}
        `

        if (hotelResult.length === 0) {
          return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 })
        }

        const hotel = hotelResult[0]
        const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

        const orderResult = await sql`
          INSERT INTO orders (
            hotel_id, 
            guest_name, 
            room_number, 
            phone_number, 
            total_amount, 
            status,
            created_at
          )
          VALUES (
            ${hotelId},
            ${`${userInfo.firstName} ${userInfo.lastName}`},
            ${userInfo.roomNumber || userInfo.hotelName || "N/A"},
            ${userInfo.phoneNumber || userInfo.email},
            ${totalAmount},
            'pending',
            NOW()
          )
          RETURNING *
        `

        const order = orderResult[0]

        for (const item of items) {
          await sql`
            INSERT INTO order_items (
              order_id,
              product_name,
              quantity,
              price,
              created_at
            )
            VALUES (
              ${order.id},
              ${item.name},
              ${item.quantity},
              ${item.price},
              NOW()
            )
          `
        }

        return NextResponse.json({
          success: true,
          checkout: {
            type: "hotel_order",
            orderId: order.id,
            orderNumber: order.order_number,
            hotelName: hotel.name,
            totalAmount,
            items,
          },
        })
      } catch (dbError) {
        console.error("Database error in hotel order checkout:", dbError)
        return NextResponse.json({ success: false, error: "Database error during order processing" }, { status: 500 })
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid checkout type. Must be "subscription" or "hotel_order"' },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[v0] Checkout API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error during checkout",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed. Use POST." }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "Method not allowed. Use POST." }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method not allowed. Use POST." }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: "Method not allowed. Use POST." }, { status: 405 })
}
