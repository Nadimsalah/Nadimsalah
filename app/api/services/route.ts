import { NextResponse } from "next/server"
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
    },
    { id: "2", name: "Restaurant", category: "Food & Beverage", icon: "🍴", description: "Fine dining restaurant" },
    {
      id: "3",
      name: "Bar & Lounge",
      category: "Food & Beverage",
      icon: "🍸",
      description: "Cocktail bar and lounge area",
    },
    { id: "4", name: "Coffee Shop", category: "Food & Beverage", icon: "☕", description: "Fresh coffee and pastries" },
  ],
  "Wellness & Relaxation": [
    {
      id: "5",
      name: "Spa Services",
      category: "Wellness & Relaxation",
      icon: "💆",
      description: "Full-service spa treatments",
    },
    { id: "6", name: "Fitness Center", category: "Wellness & Relaxation", icon: "💪", description: "24/7 gym access" },
    {
      id: "7",
      name: "Swimming Pool",
      category: "Wellness & Relaxation",
      icon: "🏊",
      description: "Indoor/outdoor pool",
    },
    {
      id: "8",
      name: "Sauna",
      category: "Wellness & Relaxation",
      icon: "🧖",
      description: "Traditional sauna experience",
    },
  ],
  "Leisure & Recreation": [
    {
      id: "9",
      name: "Entertainment",
      category: "Leisure & Recreation",
      icon: "🎭",
      description: "Live shows and events",
    },
    {
      id: "10",
      name: "Game Room",
      category: "Leisure & Recreation",
      icon: "🎮",
      description: "Gaming and recreation area",
    },
    { id: "11", name: "Library", category: "Leisure & Recreation", icon: "📚", description: "Quiet reading space" },
  ],
  "Shopping & Lifestyle": [
    {
      id: "12",
      name: "Gift Shop",
      category: "Shopping & Lifestyle",
      icon: "🛍️",
      description: "Souvenirs and essentials",
    },
    {
      id: "13",
      name: "Boutique",
      category: "Shopping & Lifestyle",
      icon: "👗",
      description: "Fashion and accessories",
    },
  ],
  "Transport & Mobility": [
    {
      id: "14",
      name: "Airport Shuttle",
      category: "Transport & Mobility",
      icon: "🚐",
      description: "Complimentary airport transfers",
    },
    {
      id: "15",
      name: "Car Rental",
      category: "Transport & Mobility",
      icon: "🚗",
      description: "Vehicle rental service",
    },
    {
      id: "16",
      name: "Taxi Service",
      category: "Transport & Mobility",
      icon: "🚕",
      description: "On-demand taxi booking",
    },
  ],
  "Business & Events": [
    {
      id: "17",
      name: "Meeting Rooms",
      category: "Business & Events",
      icon: "🏢",
      description: "Professional meeting spaces",
    },
    {
      id: "18",
      name: "Event Planning",
      category: "Business & Events",
      icon: "🎉",
      description: "Full event coordination",
    },
    {
      id: "19",
      name: "Business Center",
      category: "Business & Events",
      icon: "💼",
      description: "Printing and office services",
    },
  ],
}

export async function GET() {
  try {
    const services = await sql`
      SELECT id, name, category, icon, description
      FROM services
      ORDER BY category, name
    `

    // Group services by category
    const groupedServices = services.reduce((acc: any, service: any) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {})

    return NextResponse.json({ services: groupedServices })
  } catch (error) {
    console.error("Error fetching services:", error)

    if (error instanceof Error && error.message.includes('relation "services" does not exist')) {
      console.log("Services table doesn't exist yet, returning fallback data")
      return NextResponse.json({ services: fallbackServices })
    }

    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
