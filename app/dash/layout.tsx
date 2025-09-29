"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Shield, Users, Building, BarChart3, Settings, LogOut, Menu, User, CreditCard, FileText, HelpCircle, Database, Activity, Globe, MessageSquare, Ticket } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dash/dashboard", icon: BarChart3 },
  { name: "Hotels", href: "/dash/hotels", icon: Building },
  { name: "Users", href: "/dash/users", icon: Users },
  { name: "Analytics", href: "/dash/analytics", icon: BarChart3 },
  { name: "Payments", href: "/dash/payments", icon: CreditCard },
  { name: "Coupons", href: "/dash/coupons", icon: Ticket },
  { name: "Support Tickets", href: "/dash/support-tickets", icon: MessageSquare },
  { name: "Settings", href: "/dash/settings", icon: Settings },
]

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const isLoginPage = pathname === "/dash"

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true)
      return
    }

    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      if (userData.role === "super_admin") {
        setIsAuthenticated(true)
        setSessionInfo(userData)
      } else {
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
  }, [router, isLoginPage])

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast({
      title: "Logged out",
      description: "You have been logged out of the super admin dashboard",
    })
    router.push("/login")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
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
            {/* Super Admin Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-lg truncate">HotelTec Admin</h2>
              </div>
            </div>

            {/* User Greeting */}
            {sessionInfo && (
              <div className="text-sm text-muted-foreground">Hey, {sessionInfo.firstName || "Admin"}! 👋</div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/dash/dashboard" && pathname.startsWith(item.href))
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
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>

              <div className="lg:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-semibold text-sm">HotelTec Admin</div>
                  {sessionInfo && <div className="text-xs text-muted-foreground">Hey, {sessionInfo.firstName}!</div>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{sessionInfo?.firstName || "Admin"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {sessionInfo?.firstName} {sessionInfo?.lastName}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">{sessionInfo?.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dash/dashboard" className="cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/hotels" className="cursor-pointer">
                      <Building className="w-4 h-4 mr-2" />
                      Hotels
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/users" className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      Users
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/analytics" className="cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/payments" className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/coupons" className="cursor-pointer">
                      <Ticket className="w-4 h-4 mr-2" />
                      Coupons
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/support-tickets" className="cursor-pointer">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Support Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dash/system-health" className="cursor-pointer">
                      <Activity className="w-4 h-4 mr-2" />
                      System Health
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/database" className="cursor-pointer">
                      <Database className="w-4 h-4 mr-2" />
                      Database
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dash/reports" className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Reports
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">
                      <Globe className="w-4 h-4 mr-2" />
                      Main Website
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dash/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help & Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
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
