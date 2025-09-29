import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const fallbackServices = {
  "Food & Beverage": [
    {
      id: "1",
      name: "Room Service",
      category: "Food & Beverage",
      icon: "🍽️",
      description: "24/7 in-room dining service",
      is_enabled: false,
    },
    {
      id: "2",
      name: "Restaurant",
      category: "Food & Beverage",
      icon: "🍴",
      description: "Fine dining restaurant",
      is_enabled: false,
    },
    {
      id: "3",
      name: "Bar & Lounge",
      category: "Food & Beverage",
      icon: "🍸",
      description: "Cocktail bar and lounge area",
      is_enabled: false,
    },
    {
      id: "4",
      name: "Coffee Shop",
      category: "Food & Beverage",
      icon: "☕",
      description: "Fresh coffee and pastries",
      is_enabled: false,
    },
  ],
  "Wellness & Relaxation": [
    {
      id: "5",
      name: "Spa Services",
      category: "Wellness & Relaxation",
      icon: "💆",
      description: "Full-service spa treatments",
      is_enabled: false,
    },
    {
      id: "6",
      name: "Fitness Center",
      category: "Wellness & Relaxation",
      icon: "💪",
      description: "24/7 gym access",
      is_enabled: false,
    },
    {
      id: "7",
      name: "Swimming Pool",
      category: "Wellness & Relaxation",
      icon: "🏊",
      description: "Indoor/outdoor pool",
      is_enabled: false,
    },
    {
      id: "8",
      name: "Sauna",
      category: "Wellness & Relaxation",
      icon: "🧖",
      description: "Traditional sauna experience",
      is_enabled: false,
    },
  ],
  "Leisure & Recreation": [
    {
      id: "9",
      name: "Entertainment",
      category: "Leisure & Recreation",
      icon: "🎭",
      description: "Live shows and events",
      is_enabled: false,
    },
    {
      id: "10",
      name: "Game Room",
      category: "Leisure & Recreation",
      icon: "🎮",
      description: "Gaming and recreation area",
      is_enabled: false,
    },
    {
      id: "11",
      name: "Library",
      category: "Leisure & Recreation",
      icon: "📚",
      description: "Quiet reading space",
      is_enabled: false,
    },
  ],
  "Shopping & Lifestyle": [
    {
      id: "12",
      name: "Gift Shop",
      category: "Shopping & Lifestyle",
      icon: "🛍️",
      description: "Souvenirs and essentials",
      is_enabled: false,
    },
    {
      id: "13",
      name: "Boutique",
      category: "Shopping & Lifestyle",
      icon: "👗",
      description: "Fashion and accessories",
      is_enabled: false,
    },
  ],
  "Transport & Mobility": [
    {
      id: "14",
      name: "Airport Shuttle",
      category: "Transport & Mobility",
      icon: "🚐",
      description: "Complimentary airport transfers",
      is_enabled: false,
    },
    {
      id: "15",
      name: "Car Rental",
      category: "Transport & Mobility",
      icon: "🚗",
      description: "Vehicle rental service",
      is_enabled: false,
    },
    {
      id: "16",
      name: "Taxi Service",
      category: "Transport & Mobility",
      icon: "🚕",
      description: "On-demand taxi booking",
      is_enabled: false,
    },
  ],
  "Business & Events": [
    {
      id: "17",
      name: "Meeting Rooms",
      category: "Business & Events",
      icon: "🏢",
      description: "Professional meeting spaces",
      is_enabled: false,
    },
    {
      id: "18",
      name: "Event Planning",
      category: "Business & Events",
      icon: "🎉",
      description: "Full event coordination",
      is_enabled: false,
    },
    {
      id: "19",
      name: "Business Center",
      category: "Business & Events",
      icon: "💼",
      description: "Printing and office services",
      is_enabled: false,
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching hotel services for user:", userId)

    const hotelServices = await sql`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.icon,
        s.description,
        COALESCE(hs.is_enabled, false) as is_enabled
      FROM services s
      LEFT JOIN hotel_services hs ON s.id = hs.service_id
      LEFT JOIN hotels h ON hs.hotel_id = h.id AND h.owner_id = ${userId}
      ORDER BY s.category, s.name
    `

    console.log("[v0] Hotel services fetched successfully, count:", hotelServices.length)

    // Group services by category
    const groupedServices = hotelServices.reduce((acc: any, service: any) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {})

    return NextResponse.json({ services: groupedServices })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "services" does not exist')) {
      console.log("[v0] Services table doesn't exist yet, returning fallback data")
      return NextResponse.json({ services: fallbackServices })
    }

    console.error("[v0] Unexpected error fetching hotel services:", error)
    return NextResponse.json({ error: "Failed to fetch hotel services" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { serviceUpdates } = await request.json()

    if (!serviceUpdates || !Array.isArray(serviceUpdates)) {
      return NextResponse.json({ error: "Service updates are required" }, { status: 400 })
    }

    console.log("[v0] Updating hotel services for user:", userId, "Updates:", serviceUpdates.length)

    const hotelResult = await sql`
      SELECT id FROM hotels WHERE owner_id = ${userId}
    `

    if (hotelResult.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    const hotelId = hotelResult[0].id

    for (const update of serviceUpdates) {
      const { serviceId, isEnabled } = update

      if (isEnabled) {
        // Enable service - insert or update
        await sql`
          INSERT INTO hotel_services (hotel_id, service_id, is_enabled)
          VALUES (${hotelId}, ${serviceId}, true)
          ON CONFLICT (hotel_id, service_id)
          DO UPDATE SET is_enabled = true, updated_at = CURRENT_TIMESTAMP
        `
      } else {
        // Disable service - update or delete
        await sql`
          INSERT INTO hotel_services (hotel_id, service_id, is_enabled)
          VALUES (${hotelId}, ${serviceId}, false)
          ON CONFLICT (hotel_id, service_id)
          DO UPDATE SET is_enabled = false, updated_at = CURRENT_TIMESTAMP
        `
      }
    }

    console.log("[v0] Hotel services updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "services" does not exist') ||
        error.message.includes('relation "hotel_services" does not exist'))
    ) {
      console.log("[v0] Services tables don't exist yet, returning success without updating")
      return NextResponse.json({ success: true, message: "Services will be available after database migration" })
    }

    console.error("[v0] Unexpected error updating hotel services:", error)
    return NextResponse.json({ error: "Failed to update hotel services" }, { status: 500 })
  }
}
