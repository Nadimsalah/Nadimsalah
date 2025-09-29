import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { hotelSlug: string } }) {
  try {
    console.log("[v0] Products API GET request started")
    console.log("[v0] Products API hotel slug:", params.hotelSlug)

    if (!params.hotelSlug) {
      console.log("[v0] Products API error: Missing hotel slug")
      return NextResponse.json({ error: "Hotel slug is required" }, { status: 400 })
    }

    console.log("[v0] Products API: Testing database connection...")

    // Test database connection
    await sql`SELECT 1`
    console.log("[v0] Products API: Database connection successful")

    let actualHotelId = params.hotelSlug

    // First try to find hotel by slug
    console.log("[v0] Products API: Looking up hotel by slug...")
    let hotels = await sql`
      SELECT id, name, logo_url, store_color FROM hotels 
      WHERE slug = ${params.hotelSlug}
      LIMIT 1
    `

    // If no match by slug, try converting slug to hotel name
    if (hotels.length === 0) {
      console.log("[v0] Products API: No hotel found by slug, trying name conversion...")

      const hotelName = params.hotelSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      console.log("[v0] Products API: Converted slug to name:", hotelName)

      // Try to find hotel by name
      hotels = await sql`
        SELECT id, name, logo_url, store_color FROM hotels 
        WHERE LOWER(name) = LOWER(${hotelName})
        LIMIT 1
      `

      // If no exact match, try partial match
      if (hotels.length === 0) {
        hotels = await sql`
          SELECT id, name, logo_url, store_color FROM hotels 
          WHERE LOWER(name) LIKE LOWER(${"%" + hotelName + "%"})
          LIMIT 1
        `
      }

      // If still no match, try the slug as-is (in case it's actually an ID)
      if (hotels.length === 0) {
        hotels = await sql`
          SELECT id, name, logo_url, store_color FROM hotels 
          WHERE id = ${params.hotelSlug}
          LIMIT 1
        `
      }
    }

    if (hotels.length === 0) {
      console.log("[v0] Products API error: Hotel not found for slug:", params.hotelSlug)
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    actualHotelId = hotels[0].id
    console.log("[v0] Products API: Found hotel ID:", actualHotelId, "for hotel:", hotels[0].name)
    console.log("[v0] Products API: Hotel logo URL:", hotels[0].logo_url)
    console.log("[v0] Products API: Hotel store color:", hotels[0].store_color)

    console.log("[v0] Products API: Fetching products...")
    const products = await sql`
      SELECT 
        id,
        name,
        description,
        price,
        image_url,
        category,
        in_stock,
        rating,
        created_at,
        updated_at
      FROM products 
      WHERE hotel_id = ${actualHotelId}
      ORDER BY category, name
    `

    console.log("[v0] Products API: Raw query result:", products)
    console.log("[v0] Products API: Products fetched successfully:", products.length, "products")
    console.log("[v0] Products API: Hotel ID used in query:", actualHotelId)

    if (products.length === 0) {
      console.log("[v0] Products API: No products found for hotel_id:", actualHotelId)
      console.log("[v0] Products API: Hotel exists but has no products")

      try {
        console.log("[v0] Products API: Auto-initializing default products for hotel:", actualHotelId)

        await sql`
          INSERT INTO products (hotel_id, name, description, price, image_url, category, in_stock, rating)
          VALUES 
            (${actualHotelId}, 'Welcome Drink', 'Complimentary welcome beverage for guests', 0.00, '/hotel-welcome.jpg', 'Beverages', true, 4.5),
            (${actualHotelId}, 'Room Service Breakfast', 'Fresh breakfast delivered to your room', 25.00, '/hotel-dining.jpg', 'Food', true, 4.8),
            (${actualHotelId}, 'Premium Amenities Kit', 'Luxury toiletries and comfort items', 15.00, '/hotel-amenities.jpg', 'Amenities', true, 4.6),
            (${actualHotelId}, 'Late Checkout', 'Extend your stay until 2 PM', 20.00, '/comfortable-hotel-room.png', 'Services', true, 4.3),
            (${actualHotelId}, 'Spa Package', 'Relaxing spa treatment package', 80.00, '/hotel-amenities.jpg', 'Services', true, 4.9)
          ON CONFLICT (hotel_id, name) DO NOTHING
        `

        // Fetch the newly created products
        const newProducts = await sql`
          SELECT 
            id,
            name,
            description,
            price,
            image_url,
            category,
            in_stock,
            rating,
            created_at,
            updated_at
          FROM products 
          WHERE hotel_id = ${actualHotelId}
          ORDER BY category, name
        `

        console.log("[v0] Products API: Auto-initialized", newProducts.length, "default products")

        return NextResponse.json({
          success: true,
          products: newProducts,
          hotel: {
            id: actualHotelId,
            name: hotels[0].name,
            logo_url: hotels[0].logo_url,
            store_color: hotels[0].store_color,
          },
          message: "Default products have been initialized for your hotel store.",
        })
      } catch (initError: any) {
        console.log("[v0] Products API: Failed to auto-initialize products:", initError.message)

        return NextResponse.json({
          success: true,
          products: [],
          hotel: {
            id: actualHotelId,
            name: hotels[0].name,
            logo_url: hotels[0].logo_url,
            store_color: hotels[0].store_color,
          },
          message: "Hotel found but no products available yet. Please add products to your hotel.",
        })
      }
    }

    return NextResponse.json({
      success: true,
      products: products,
      hotel: {
        id: actualHotelId,
        name: hotels[0].name,
        logo_url: hotels[0].logo_url,
        store_color: hotels[0].store_color,
      },
    })
  } catch (error: any) {
    console.log("[v0] Products API error:", error.message)
    console.log("[v0] Products API error stack:", error.stack)

    if (error.message?.includes('relation "products" does not exist')) {
      console.log("[v0] Products table does not exist, returning empty array")
      return NextResponse.json({
        success: true,
        products: [],
        message:
          "Products feature requires database setup. Please run the database migration script to enable products functionality.",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
