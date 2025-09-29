import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const hotelSlug = request.headers.get("X-Hotel-Slug")
    console.log("[v0] Hotel Profile API - User ID:", userId)
    console.log("[v0] Hotel Profile API - Hotel Slug:", hotelSlug)

    if (hotelSlug) {
      console.log("[v0] Hotel Profile API - Looking up hotel by slug:", hotelSlug)
      try {
        const hotelResult = await sql`
          SELECT h.id, h.name, h.description, h.logo_url, h.slug, h.created_at, h.updated_at,
                 h.contact_number, h.address, h.facebook_url, h.instagram_url, h.twitter_url, h.linkedin_url,
                 h.store_color, h.owner_number, h.currency, h.country, h.city,
                 u.email as user_email, u.first_name, u.last_name
          FROM hotels h 
          JOIN users u ON h.owner_id = u.id
          WHERE h.slug = ${hotelSlug}
          LIMIT 1
        `
        console.log("[v0] Hotel Profile API - Hotel by slug query result:", hotelResult)

        if (hotelResult.length === 0) {
          console.log("[v0] Hotel Profile API - Hotel not found by slug")
          return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 })
        }

        const hotel = hotelResult[0]
        const hotelWithDefaults = {
          ...hotel,
          slug: hotel.slug || hotel.id,
          email: hotel.user_email,
          phone: null,
          address: hotel.address || null,
          website: null,
          primary_color: "#000000",
          currency: hotel.currency || "USD",
          tax_rate: 8.5,
          delivery_fee: 5.0,
          minimum_order: 15.0,
          operating_hours: "24/7",
          enable_notifications: true,
          enable_qr_ordering: true,
          enable_room_delivery: true,
          notification_new_orders: true,
          notification_low_stock: true,
          notification_daily_reports: false,
          notification_promotions: true,
          notification_system_updates: false,
        }

        console.log("[v0] Hotel Profile API - Response for slug with hotel:", hotelWithDefaults)
        return NextResponse.json({ success: true, hotel: hotelWithDefaults })
      } catch (slugError) {
        console.error("[v0] Hotel Profile API - Error in slug query:", slugError)
        return NextResponse.json({ success: false, error: "Database error during slug lookup" }, { status: 500 })
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Hotel Profile API - Looking up hotel by owner_id:", userId)
    let hotelResult
    try {
      hotelResult = await sql`
        SELECT h.id, h.name, h.description, h.logo_url, h.slug, h.created_at, h.updated_at,
               h.contact_number, h.address, h.facebook_url, h.instagram_url, h.twitter_url, h.linkedin_url,
               h.store_color, h.owner_number, h.currency, h.country, h.city,
               u.email as user_email, u.first_name, u.last_name
        FROM hotels h 
        JOIN users u ON h.owner_id = u.id
        WHERE h.owner_id = ${userId}
        LIMIT 1
      `
      console.log("[v0] Hotel Profile API - Hotel query result:", hotelResult)
    } catch (queryError) {
      console.error("[v0] Hotel Profile API - Error in owner_id query:", queryError)
      return NextResponse.json({ success: false, error: "Database error during hotel lookup" }, { status: 500 })
    }

    if (hotelResult.length === 0) {
      console.log("[v0] Hotel Profile API - No hotel found, checking user and creating hotel")
      try {
        const userResult = await sql`
          SELECT id, first_name, last_name, hotel_name, email
          FROM users 
          WHERE id = ${userId}
          LIMIT 1
        `
        console.log("[v0] Hotel Profile API - User query result:", userResult)

        if (userResult.length === 0) {
          console.log("[v0] Hotel Profile API - User not found")
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }

        const user = userResult[0]
        const hotelId = crypto.randomUUID()
        const hotelName = user.hotel_name || "My Hotel"
        const slug = hotelName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
        console.log("[v0] Hotel Profile API - Creating new hotel with ID:", hotelId, "and slug:", slug)

        await sql`
          INSERT INTO hotels (id, name, description, logo_url, slug, owner_id, currency)
          VALUES (${hotelId}, ${hotelName}, 'Welcome to our hotel store', ${null}, ${slug}, ${userId}, 'USD')
        `

        hotelResult = await sql`
          SELECT h.id, h.name, h.description, h.logo_url, h.slug, h.created_at, h.updated_at,
                 h.contact_number, h.address, h.facebook_url, h.instagram_url, h.twitter_url, h.linkedin_url,
                 h.store_color, h.owner_number, h.currency, h.country, h.city,
                 u.email as user_email, u.first_name, u.last_name
          FROM hotels h 
          JOIN users u ON h.owner_id = u.id
          WHERE h.owner_id = ${userId}
          LIMIT 1
        `
        console.log("[v0] Hotel Profile API - Newly created hotel result:", hotelResult)

        try {
          // Add default products
          await sql`
            INSERT INTO products (id, hotel_id, name, description, image_url, category, price, rating, in_stock, created_at, updated_at)
            VALUES 
              (gen_random_uuid()::text, ${hotelId}, 'Coffee', 'Fresh brewed coffee', '/placeholder.svg?height=200&width=200', 'Beverages', 5.00, 4.5, true, NOW(), NOW()),
              (gen_random_uuid()::text, ${hotelId}, 'Tea', 'Premium tea selection', '/placeholder.svg?height=200&width=200', 'Beverages', 3.50, 4.2, true, NOW(), NOW()),
              (gen_random_uuid()::text, ${hotelId}, 'Sandwich', 'Delicious club sandwich', '/placeholder.svg?height=200&width=200', 'Food', 12.00, 4.7, true, NOW(), NOW()),
              (gen_random_uuid()::text, ${hotelId}, 'Towels', 'Extra towels for your room', '/placeholder.svg?height=200&width=200', 'Amenities', 8.00, 4.3, true, NOW(), NOW()),
              (gen_random_uuid()::text, ${hotelId}, 'Snacks', 'Assorted snacks', '/placeholder.svg?height=200&width=200', 'Food', 6.50, 4.1, true, NOW(), NOW())
          `

          // Add default highlights
          await sql`
            INSERT INTO highlights (hotel_id, title, description, sort_order, cover_image) VALUES
            (${hotelId}, 'Welcome', 'Welcome to our hotel', 1, '/hotel-welcome.jpg'),
            (${hotelId}, 'Rooms', 'Our beautiful rooms', 2, '/comfortable-hotel-room.png'),
            (${hotelId}, 'Dining', 'Dining experiences', 3, '/hotel-dining.jpg'),
            (${hotelId}, 'Amenities', 'Hotel amenities', 4, '/hotel-amenities.jpg')
          `

          console.log("[v0] Added default content for dynamically created hotel:", hotelId)
        } catch (contentError) {
          console.log("[v0] Warning: Could not add default content (tables may not exist):", contentError.message)
        }
      } catch (createError) {
        console.error("[v0] Hotel Profile API - Error creating hotel:", createError)
        return NextResponse.json({ success: false, error: "Database error during hotel creation" }, { status: 500 })
      }
    }

    const hotel = hotelResult[0]
    console.log("[v0] Hotel Profile API - Hotel slug value:", hotel.slug)
    console.log("[v0] Hotel Profile API - Final hotel data:", hotel)

    const hotelWithDefaults = {
      ...hotel,
      slug:
        hotel.slug ||
        hotel.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        hotel.id,
      email: hotel.user_email,
      phone: null,
      address: hotel.address || null,
      website: null,
      primary_color: "#000000",
      currency: hotel.currency || "USD",
      tax_rate: 8.5,
      delivery_fee: 5.0,
      minimum_order: 15.0,
      operating_hours: "24/7",
      enable_notifications: true,
      enable_qr_ordering: true,
      enable_room_delivery: true,
      notification_new_orders: true,
      notification_low_stock: true,
      notification_daily_reports: false,
      notification_promotions: true,
      notification_system_updates: false,
    }

    console.log("[v0] Hotel Profile API - Response with slug:", hotelWithDefaults.slug)
    return NextResponse.json({ success: true, hotel: hotelWithDefaults })
  } catch (error) {
    console.error("Error fetching hotel profile:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch hotel profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const body = await request.json()

    console.log("[v0] Hotel Profile API PUT - Request body:", body)

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    try {
      if (body.store_color !== undefined) {
        console.log("[v0] Updating store_color to:", body.store_color)
        await sql`UPDATE hotels SET store_color = ${body.store_color}, updated_at = NOW() WHERE owner_id = ${userId}`
      }

      if (body.name !== undefined) {
        const slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
        await sql`UPDATE hotels SET name = ${body.name}, slug = ${slug}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.description !== undefined) {
        await sql`UPDATE hotels SET description = ${body.description}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.logo_url !== undefined) {
        await sql`UPDATE hotels SET logo_url = ${body.logo_url}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.contact_number !== undefined) {
        await sql`UPDATE hotels SET contact_number = ${body.contact_number}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.address !== undefined) {
        await sql`UPDATE hotels SET address = ${body.address}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.owner_number !== undefined) {
        await sql`UPDATE hotels SET owner_number = ${body.owner_number}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.currency !== undefined) {
        await sql`UPDATE hotels SET currency = ${body.currency}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.country !== undefined) {
        await sql`UPDATE hotels SET country = ${body.country}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.city !== undefined) {
        await sql`UPDATE hotels SET city = ${body.city}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.facebook_url !== undefined) {
        await sql`UPDATE hotels SET facebook_url = ${body.facebook_url}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.instagram_url !== undefined) {
        await sql`UPDATE hotels SET instagram_url = ${body.instagram_url}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.twitter_url !== undefined) {
        await sql`UPDATE hotels SET twitter_url = ${body.twitter_url}, updated_at = NOW() WHERE owner_id = ${userId}`
      }
      if (body.linkedin_url !== undefined) {
        await sql`UPDATE hotels SET linkedin_url = ${body.linkedin_url}, updated_at = NOW() WHERE owner_id = ${userId}`
      }

      if (body.email !== undefined) {
        await sql`UPDATE users SET email = ${body.email} WHERE id = ${userId}`
      }
      if (body.first_name !== undefined) {
        await sql`UPDATE users SET first_name = ${body.first_name} WHERE id = ${userId}`
      }
      if (body.last_name !== undefined) {
        await sql`UPDATE users SET last_name = ${body.last_name} WHERE id = ${userId}`
      }
    } catch (updateError) {
      console.error("[v0] Hotel Profile API PUT - Database update error:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update hotel information" }, { status: 500 })
    }

    const result = await sql`
      SELECT h.id, h.name, h.description, h.logo_url, h.slug, h.created_at, h.updated_at,
             h.contact_number, h.address, h.facebook_url, h.instagram_url, h.twitter_url, h.linkedin_url,
             h.store_color, h.owner_number, h.currency, h.country, h.city,
             u.email as user_email, u.first_name, u.last_name
      FROM hotels h 
      JOIN users u ON h.owner_id = u.id
      WHERE h.owner_id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 })
    }

    const hotel = result[0]
    const hotelWithDefaults = {
      ...hotel,
      slug: hotel.slug || hotel.id,
      email: hotel.user_email,
      phone: null,
      address: hotel.address || null,
      website: null,
      primary_color: "#000000",
      currency: hotel.currency || "USD",
      tax_rate: 8.5,
      delivery_fee: 5.0,
      minimum_order: 15.0,
      operating_hours: "24/7",
      enable_notifications: true,
      enable_qr_ordering: true,
      enable_room_delivery: true,
      notification_new_orders: true,
      notification_low_stock: true,
      notification_daily_reports: false,
      notification_promotions: true,
      notification_system_updates: false,
    }

    console.log("[v0] Hotel Profile API PUT - Updated hotel:", hotelWithDefaults)
    return NextResponse.json({ success: true, hotel: hotelWithDefaults })
  } catch (error) {
    console.error("Error updating hotel profile:", error)
    return NextResponse.json({ success: false, error: "Failed to update hotel profile" }, { status: 500 })
  }
}
