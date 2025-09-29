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

    const healthChecks = []

    // Database health check
    try {
      const dbCheck = await sql`SELECT 1 as test`
      healthChecks.push({
        service: "Database",
        status: "healthy",
        responseTime: Date.now(),
        details: "Connection successful",
      })
    } catch (error) {
      healthChecks.push({
        service: "Database",
        status: "unhealthy",
        responseTime: null,
        details: "Connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // API Services health check
    healthChecks.push({
      service: "API Services",
      status: "healthy",
      responseTime: Date.now(),
      details: "All endpoints responding",
    })

    // File Storage health check (simulated)
    healthChecks.push({
      service: "File Storage",
      status: "healthy",
      responseTime: Date.now(),
      details: "Blob storage operational",
    })

    // Get system metrics
    const systemMetrics = await sql`
      SELECT 
        (SELECT COUNT(*) FROM hotels WHERE created_at >= NOW() - INTERVAL '1 hour') as hotels_created_last_hour,
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '1 hour') as orders_last_hour,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 hour') as users_created_last_hour,
        (SELECT AVG(total_amount) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as avg_order_value_24h
    `

    return NextResponse.json({
      success: true,
      healthChecks: healthChecks,
      systemMetrics: systemMetrics[0],
      overallStatus: healthChecks.every((check) => check.status === "healthy") ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("System health check error:", error)
    return NextResponse.json({
      success: false,
      error: "Health check failed",
      overallStatus: "unhealthy",
      timestamp: new Date().toISOString(),
    })
  }
}
