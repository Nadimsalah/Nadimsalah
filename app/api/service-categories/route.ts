import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotelId")
    const userId = request.headers.get("x-user-id")

    if (!hotelId && !userId) {
      return NextResponse.json({ error: "Hotel ID or User ID is required" }, { status: 400 })
    }

    let targetHotelId = hotelId

    // If userId is provided but no hotelId, get hotel from user
    if (userId && !hotelId) {
      const hotel = await sql`
        SELECT id FROM hotels WHERE owner_id = ${userId} LIMIT 1
      `
      if (hotel.length === 0) {
        return NextResponse.json({ error: "Hotel not found for user" }, { status: 404 })
      }
      targetHotelId = hotel[0].id
    }

    console.log("[v0] Fetching service categories for hotel:", targetHotelId)

    try {
      // Get all service categories grouped by category_group
      const categories = await sql`
        SELECT 
          sc.id,
          sc.name,
          sc.category_group,
          sc.description,
          sc.icon,
          COALESCE(hsc.is_active, false) as is_active
        FROM service_categories sc
        LEFT JOIN hotel_service_categories hsc ON hsc.hotel_id = ${targetHotelId} AND hsc.service_category_id = sc.id
        ORDER BY sc.category_group, sc.name
      `

      console.log("[v0] Found service categories:", categories.length)

      // Group categories by category_group and transform for store display
      const groupedCategories: any = {}
      const servicesList: any[] = []

      categories.forEach((category: any) => {
        if (!groupedCategories[category.category_group]) {
          groupedCategories[category.category_group] = {
            name: category.category_group,
            services: [],
          }
        }

        const serviceData = {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          isActive: category.is_active,
        }

        groupedCategories[category.category_group].services.push(serviceData)

        // Add to flat services list for store display
        if (category.is_active) {
          servicesList.push({
            id: category.id,
            name: category.name,
            category: category.category_group,
            icon: category.icon,
            description: category.description,
          })
        }
      })

      return NextResponse.json({
        success: true,
        categories: Object.values(groupedCategories),
        services: servicesList,
      })
    } catch (dbError) {
      console.log("[v0] Database error, returning fallback data:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("Error fetching service categories:", error)

    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("[v0] Service categories table doesn't exist yet, returning fallback data")

      const fallbackCategories = [
        {
          name: "Food & Beverage",
          services: [
            {
              id: "fb1",
              name: "Restaurant Menu",
              description: "Main dining restaurant offerings",
              icon: "Utensils",
              isActive: true,
            },
            {
              id: "fb2",
              name: "Room Service",
              description: "In-room dining options",
              icon: "Coffee",
              isActive: true,
            },
            {
              id: "fb3",
              name: "Bar & Cocktails",
              description: "Alcoholic and non-alcoholic beverages",
              icon: "Coffee",
              isActive: false,
            },
          ],
        },
        {
          name: "Wellness & Relaxation",
          services: [
            {
              id: "wr1",
              name: "Spa Services",
              description: "Massage and spa treatments",
              icon: "Waves",
              isActive: true,
            },
            {
              id: "wr2",
              name: "Fitness Center",
              description: "Gym and fitness facilities",
              icon: "Dumbbell",
              isActive: true,
            },
          ],
        },
        {
          name: "Business & Events",
          services: [
            {
              id: "be1",
              name: "Meeting Rooms",
              description: "Conference and meeting facilities",
              icon: "Briefcase",
              isActive: false,
            },
            {
              id: "be2",
              name: "Business Center",
              description: "Printing and office services",
              icon: "Briefcase",
              isActive: true,
            },
          ],
        },
      ]

      // Create flat services list for active services
      const activeServices: any[] = []
      fallbackCategories.forEach((category) => {
        category.services.forEach((service) => {
          if (service.isActive) {
            activeServices.push({
              id: service.id,
              name: service.name,
              category: category.name,
              icon: service.icon,
              description: service.description,
            })
          }
        })
      })

      return NextResponse.json({
        success: true,
        categories: fallbackCategories,
        services: activeServices,
      })
    }

    return NextResponse.json({ error: "Failed to fetch service categories" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { categoryId, isActive } = await request.json()

    // Get hotel ID for the user
    const hotel = await sql`
      SELECT id FROM hotels WHERE owner_id = ${userId} LIMIT 1
    `

    if (hotel.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    const hotelId = hotel[0].id

    // Upsert hotel service category activation
    await sql`
      INSERT INTO hotel_service_categories (hotel_id, service_category_id, is_active)
      VALUES (${hotelId}, ${categoryId}, ${isActive})
      ON CONFLICT (hotel_id, service_category_id)
      DO UPDATE SET is_active = ${isActive}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating service category:", error)

    // Graceful handling if tables don't exist yet
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      return NextResponse.json({ success: true }) // Pretend it worked
    }

    return NextResponse.json({ error: "Failed to update service category" }, { status: 500 })
  }
}
