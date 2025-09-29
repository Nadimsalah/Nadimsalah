"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  LogOut,
  Eye,
  User,
  HelpCircle,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Store Preview", href: "/dashboard/store-preview", icon: Eye },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orderCount, setOrderCount] = useState(0)
  const [userData, setUserData] = useState<any>(null)
  const [hotelData, setHotelData] = useState<any>(null)
  const pathname = usePathname()

  const refreshHotelData = async (userId: string) => {
    try {
      console.log("[v0] Refreshing hotel data for user:", userId)

      const response = await fetch(`/api/hotels/profile`, {
        headers: {
          "x-user-id": userId,
        },
      })

      console.log("[v0] Hotel API response status:", response.status)
      const data = await response.json()
      console.log("[v0] Hotel API response data:", data)

      if (data.hotel) {
        setHotelData(data.hotel)
        console.log("[v0] Hotel data refreshed successfully:", data.hotel)
      } else if (data.error) {
        console.error("[v0] Hotel API error:", data.error)
        // If no hotel found, create a fallback hotel data from user data
        if (data.error === "Hotel not found") {
          setHotelData({
            name: userData?.hotelName || "HotelTec",
            description: "Welcome to our hotel store",
            logo_url: null,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error refreshing hotel data:", error)
      // Fallback to user data if API fails
      setHotelData({
        name: userData?.hotelName || "HotelTec",
        description: "Welcome to our hotel store",
        logo_url: null,
      })
    }
  }

  useEffect(() => {
    const loadUserData = () => {
      const user = localStorage.getItem("user")
      if (user) {
        const parsedUser = JSON.parse(user)
        setUserData(parsedUser)
        refreshHotelData(parsedUser.id)
      }
    }

    loadUserData()

    const handleHotelDataUpdate = () => {
      const user = localStorage.getItem("user")
      if (user) {
        const parsedUser = JSON.parse(user)
        refreshHotelData(parsedUser.id)
      }
    }

    // Listen for custom events when hotel data is updated
    window.addEventListener("hotelDataUpdated", handleHotelDataUpdate)

    return () => {
      window.removeEventListener("hotelDataUpdated", handleHotelDataUpdate)
    }
  }, [userData?.hotelName])

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const user = localStorage.getItem("user")
        if (!user) return

        const response = await fetch("/api/orders", {
          headers: {
            "x-user-id": JSON.parse(user).id,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setOrderCount(data.orders.length)
          }
        }
      } catch (error) {
        console.error("Error fetching order count:", error)
      }
    }

    fetchOrderCount()
    // Refresh count every 30 seconds
    const interval = setInterval(fetchOrderCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b space-y-3">
            {/* Hotel Logo and Name */}
            <div className="flex items-center gap-3">
              {hotelData?.logo_url ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 p-1">
                  {hotelData.logo_url.startsWith("data:") ? (
                    <img
                      src={hotelData.logo_url || "/placeholder.svg"}
                      alt={hotelData.name || "Hotel Logo"}
                      className="w-full h-full object-contain"
                      onLoad={() => {
                        console.log("[v0] Hotel logo (img) loaded successfully")
                      }}
                      onError={(e) => {
                        console.log("[v0] Hotel logo (img) failed to load, using fallback")
                        const target = e.target as HTMLImageElement
                        target.src = "/images/hoteltec-logo.png"
                      }}
                    />
                  ) : (
                    <Image
                      src={hotelData.logo_url || "/placeholder.svg"}
                      alt={hotelData.name || "Hotel Logo"}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                      onLoad={() => {
                        console.log("[v0] Hotel logo (Image) loaded successfully")
                      }}
                      onError={(e) => {
                        console.log("[v0] Hotel logo (Image) failed to load, using fallback")
                        const target = e.target as HTMLImageElement
                        target.src = "/images/hoteltec-logo.png"
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 p-1">
                  <Image
                    src="/images/hoteltec-logo.png"
                    alt="HotelTec Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-lg truncate">
                  {hotelData?.name || userData?.hotelName || "HotelTec"}
                </h2>
              </div>
            </div>

            {/* User Greeting */}
            {userData && <div className="text-sm text-muted-foreground">Hey, {userData.firstName || "User"}! 👋</div>}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {item.name === "Orders" && orderCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {orderCount > 99 ? "99+" : orderCount}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3" asChild onClick={handleSignOut}>
              <Link href="/login">
                <LogOut className="w-4 h-4" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>

              <div className="lg:hidden flex items-center gap-3">
                {hotelData?.logo_url ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-1">
                    {hotelData.logo_url.startsWith("data:") ? (
                      <img
                        src={hotelData.logo_url || "/placeholder.svg"}
                        alt={hotelData.name || "Hotel Logo"}
                        className="w-full h-full object-contain"
                        onLoad={() => {
                          console.log("[v0] Mobile hotel logo (img) loaded successfully")
                        }}
                        onError={(e) => {
                          console.log("[v0] Mobile hotel logo (img) failed to load, using fallback")
                          const target = e.target as HTMLImageElement
                          target.src = "/images/hoteltec-logo.png"
                        }}
                      />
                    ) : (
                      <Image
                        src={hotelData.logo_url || "/placeholder.svg"}
                        alt={hotelData.name || "Hotel Logo"}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                        onLoad={() => {
                          console.log("[v0] Mobile hotel logo (Image) loaded successfully")
                        }}
                        onError={(e) => {
                          console.log("[v0] Mobile hotel logo (Image) failed to load, using fallback")
                          const target = e.target as HTMLImageElement
                          target.src = "/images/hoteltec-logo.png"
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-1">
                    <Image
                      src="/images/hoteltec-logo.png"
                      alt="HotelTec Logo"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="hidden sm:block">
                  <div className="font-semibold text-sm">{hotelData?.name || userData?.hotelName || "HotelTec"}</div>
                  {userData && <div className="text-xs text-muted-foreground">Hey, {userData.firstName}!</div>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{userData?.firstName || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {userData?.firstName} {userData?.lastName}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">{userData?.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/products" className="cursor-pointer">
                      <Package className="w-4 h-4 mr-2" />
                      Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders" className="cursor-pointer">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/store-preview" className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" />
                      Store Preview
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/subscription" className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/support" className="cursor-pointer">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help & Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
