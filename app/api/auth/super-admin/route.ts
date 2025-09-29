import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Hardcoded super admin credentials
    const SUPER_ADMIN_USERNAME = "Hoteltec"
    const SUPER_ADMIN_PASSWORD = "Admin123456789"

    if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        username: username,
        role: "super_admin",
        message: "Super admin authentication successful",
      })
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    console.error("Super admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
