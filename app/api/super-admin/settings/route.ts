import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("SuperAdmin ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get platform settings (simulated - in real app, these would be stored in a settings table)
    const platformSettings = {
      maintenanceMode: false,
      registrationEnabled: true,
      maxHotelsPerUser: 1,
      maxProductsPerHotel: 100,
      maxStoriesPerHotel: 50,
      platformName: "HotelTec",
      supportEmail: "support@hoteltec.app",
      maxFileUploadSize: 10, // MB
      sessionTimeout: 24, // hours
      enableAnalytics: true,
      enableNotifications: true,
    }

    return NextResponse.json({
      success: true,
      settings: platformSettings,
    })
  } catch (error) {
    console.error("Super admin settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("SuperAdmin ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await request.json()

    // In a real application, you would save these settings to a database
    // For now, we'll just return success
    console.log("Platform settings updated:", settings)

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      settings: settings,
    })
  } catch (error) {
    console.error("Super admin settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
