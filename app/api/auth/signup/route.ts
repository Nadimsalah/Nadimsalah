import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, hotelName, email, password, planId, paymentIntentId } = body

    // Validate required fields
    if (!firstName || !lastName || !hotelName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      )
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          hotel_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) DEFAULT 'hotel_owner',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          current_subscription_id TEXT
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS hotels (
          id TEXT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          logo_url TEXT,
          slug VARCHAR(255),
          contact_number VARCHAR(50),
          address TEXT,
          facebook_url TEXT,
          instagram_url TEXT,
          twitter_url TEXT,
          linkedin_url TEXT,
          store_color VARCHAR(7) DEFAULT '#8b5cf6',
          owner_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
      await sql`CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug)`
    } catch (tableError) {
      console.error("[v0] Table creation error:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: "Database initialization failed. Please try again.",
        },
        { status: 503 },
      )
    }

    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists",
        },
        { status: 409 },
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const userId = randomUUID()
    const hotelId = randomUUID()

    const hotelSlug =
      hotelName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-") +
      "-" +
      Math.random().toString(36).substring(2, 5)

    // Create user
    const result = await sql`
      INSERT INTO users (
        id, 
        first_name, 
        last_name,
        hotel_name,
        email, 
        password_hash,
        role
      )
      VALUES (
        ${userId},
        ${firstName}, 
        ${lastName},
        ${hotelName},
        ${email}, 
        ${passwordHash},
        'hotel_owner'
      )
      RETURNING id, first_name, last_name, hotel_name, email, created_at
    `

    await sql`
      INSERT INTO hotels (
        id,
        name,
        description,
        logo_url,
        slug,
        store_color,
        owner_id
      )
      VALUES (
        ${hotelId},
        ${hotelName},
        'Welcome to our hotel store',
        ${null},
        ${hotelSlug},
        '#8b5cf6',
        ${userId}
      )
    `

    try {
      // Check if products table exists before inserting
      const tablesExist = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('products', 'highlights', 'stories')
      `

      const existingTables = tablesExist.map((row) => row.table_name)

      if (existingTables.includes("products")) {
        await sql`
          INSERT INTO products (id, hotel_id, name, description, image_url, category, price, rating, in_stock, created_at, updated_at)
          VALUES 
            (${randomUUID()}, ${hotelId}, 'Coffee', 'Fresh brewed coffee', '/placeholder.svg?height=200&width=200', 'Beverages', 5.00, 4.5, true, NOW(), NOW()),
            (${randomUUID()}, ${hotelId}, 'Tea', 'Premium tea selection', '/placeholder.svg?height=200&width=200', 'Beverages', 3.50, 4.2, true, NOW(), NOW()),
            (${randomUUID()}, ${hotelId}, 'Sandwich', 'Delicious club sandwich', '/placeholder.svg?height=200&width=200', 'Food', 12.00, 4.7, true, NOW(), NOW()),
            (${randomUUID()}, ${hotelId}, 'Towels', 'Extra towels for your room', '/placeholder.svg?height=200&width=200', 'Amenities', 8.00, 4.3, true, NOW(), NOW()),
            (${randomUUID()}, ${hotelId}, 'Snacks', 'Assorted snacks', '/placeholder.svg?height=200&width=200', 'Food', 6.50, 4.1, true, NOW(), NOW())
        `
        console.log("[v0] Added default products for hotel:", hotelId)
      }

      if (existingTables.includes("highlights")) {
        await sql`
          INSERT INTO highlights (hotel_id, title, description, sort_order, cover_image) VALUES
          (${hotelId}, 'Welcome', 'Welcome to our hotel', 1, '/hotel-welcome.jpg'),
          (${hotelId}, 'Rooms', 'Beautiful rooms', 2, '/comfortable-hotel-room.png')
        `
        console.log("[v0] Added default highlights for hotel:", hotelId)
      }

      if (existingTables.includes("stories")) {
        await sql`
          INSERT INTO stories (hotel_id, media_url, thumbnail_url, media_type, caption, is_highlight, created_at, expires_at)
          VALUES 
          (${hotelId}, '/hotel-welcome-story.jpg', '/hotel-welcome.jpg', 'image', 'Welcome to ${hotelName}!', true, NOW(), NOW() + INTERVAL '30 days'),
          (${hotelId}, '/hotel-room-story.jpg', '/comfortable-hotel-room.png', 'image', 'Check out our rooms!', true, NOW(), NOW() + INTERVAL '30 days')
        `
        console.log("[v0] Added default stories for hotel:", hotelId)
      }
    } catch (contentError) {
      console.log("[v0] Could not add default content (tables may not exist):", contentError.message)
      // Don't fail signup if content creation fails
    }

    try {
      const subscriptionTables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('subscription_plans', 'user_subscriptions')
      `

      if (subscriptionTables.length === 2) {
        let selectedPlan = null

        // If planId is provided, use that plan, otherwise default to free trial
        if (planId) {
          const planResult = await sql`
            SELECT id, name, price FROM subscription_plans 
            WHERE id = ${planId} AND is_active = true
            LIMIT 1
          `
          selectedPlan = planResult[0] || null
        }

        // Fallback to free trial if no plan specified or plan not found
        if (!selectedPlan) {
          const freeTrialResult = await sql`
            SELECT id, name, price FROM subscription_plans 
            WHERE name = 'Free Trial' AND is_active = true
            LIMIT 1
          `
          selectedPlan = freeTrialResult[0] || null
        }

        if (selectedPlan) {
          const subscriptionId = randomUUID()
          const startDate = new Date()
          const endDate = new Date()
          let paymentMethod = "free_trial"
          const status = "active"

          // Set subscription duration based on plan
          if (selectedPlan.name === "Free Trial") {
            endDate.setDate(endDate.getDate() + 14) // 14 days for trial
            paymentMethod = "free_trial"
          } else {
            endDate.setMonth(endDate.getMonth() + 12) // 12 months for paid plans
            paymentMethod = paymentIntentId ? "stripe" : "free"
          }

          await sql`
            INSERT INTO user_subscriptions (
              id, user_id, plan_id, status, start_date, end_date, 
              payment_method, payment_intent_id, auto_renew
            )
            VALUES (
              ${subscriptionId}, ${userId}, ${selectedPlan.id}, ${status},
              ${startDate.toISOString()}, ${endDate.toISOString()}, 
              ${paymentMethod}, ${paymentIntentId || null}, true
            )
          `

          await sql`UPDATE users SET current_subscription_id = ${subscriptionId} WHERE id = ${userId}`
          console.log(`[v0] Created ${selectedPlan.name} subscription for user:`, userId)
        }
      }
    } catch (subscriptionError) {
      console.log("[v0] Subscription creation skipped:", subscriptionError.message)
    }

    const newUser = result[0]

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          hotelName: newUser.hotel_name,
          email: newUser.email,
          createdAt: newUser.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      },
      { status: 500 },
    )
  }
}
