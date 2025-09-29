"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  X,
  Bell,
  MessageSquare,
  AlertCircle,
  Crown,
  ArrowUpCircle,
  Camera,
  Phone,
  MapPin,
  Globe,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    storeViews: 0,
    recentOrders: [],
    topProducts: [],
  })
  const [supportStats, setSupportStats] = useState({
    openTickets: 0,
    recentTickets: [],
  })
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hotelData, setHotelData] = useState<any>(null)
  const [newOrderNotification, setNewOrderNotification] = useState<any>(null)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState({
    hotelName: "",
    description: "",
    phone: "",
    address: "",
    website: "",
    logoFile: null as File | null,
  })
  const audioContextRef = useRef<AudioContext | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const getUserData = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }

  const handleOnboardingNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      handleCompleteOnboarding()
    }
  }

  const handleCompleteOnboarding = async () => {
    try {
      const user = getUserData()
      if (!user) return

      // Upload logo if provided
      let logoUrl = null
      if (onboardingData.logoFile) {
        const formData = new FormData()
        formData.append("file", onboardingData.logoFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          logoUrl = uploadData.url
        }
      }

      // Update hotel profile
      const response = await fetch("/api/hotels/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: onboardingData.hotelName || user.hotelName,
          description: onboardingData.description,
          phone: onboardingData.phone,
          address: onboardingData.address,
          website: onboardingData.website,
          logo_url: logoUrl,
        }),
      })

      if (response.ok) {
        setShowOnboarding(false)
        fetchHotelData() // Refresh hotel data
        // Remove URL parameters
        router.replace("/dashboard")
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const handleSkipOnboarding = () => {
    setShowOnboarding(false)
    router.replace("/dashboard")
  }

  useEffect(() => {
    fetchAnalytics()
    fetchHotelData()
    fetchSupportStats()
    fetchSubscriptionData()

    const isNewAccount = searchParams.get("welcome") === "true" || localStorage.getItem("needsOnboarding") === "true"
    if (isNewAccount) {
      setShowOnboarding(true)
      localStorage.removeItem("needsOnboarding") // Clear the flag
    }

    checkForNewOrders() // Initial check
    pollingIntervalRef.current = setInterval(() => {
      checkForNewOrders()
    }, 10000) // Reduced from 30 seconds to 10 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [searchParams])

  const fetchSubscriptionData = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch("/api/subscriptions", {
        headers: {
          "user-id": user.id,
        },
      })

      const data = await response.json()

      if (data.success && data.subscription) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    }
  }

  const checkForNewOrders = async () => {
    try {
      const user = getUserData()
      if (!user) return

      console.log("[v0] Checking for new orders...")

      const response = await fetch("/api/orders", {
        headers: { "x-user-id": user.id },
      })

      if (!response.ok) {
        console.error("[v0] Orders API returned error status:", response.status)
        return
      }

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Orders API returned non-JSON response:", contentType)
        return
      }

      const data = await response.json()

      console.log("[v0] Orders API response:", data)

      if (data.success && data.orders) {
        const currentOrderCount = data.orders.length
        console.log("[v0] Current order count:", currentOrderCount, "Last order count:", lastOrderCount)

        if (currentOrderCount > lastOrderCount) {
          const newOrders = data.orders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, currentOrderCount - lastOrderCount)

          const latestOrder = newOrders[0]
          console.log("[v0] New order detected:", latestOrder)

          setNewOrderNotification({
            id: latestOrder.order_number ? latestOrder.order_number.toString().padStart(5, "0") : "00000",
            room: `Room ${latestOrder.room_number}`,
            amount: `${Number(latestOrder.total_amount || 0).toFixed(2)} MAD`,
            timestamp: new Date().toLocaleTimeString(),
          })

          console.log("[v0] Playing notification sound...")
          playNotificationSound()

          setTimeout(() => {
            setNewOrderNotification(null)
          }, 15000)
        }

        setLastOrderCount(currentOrderCount)
      }
    } catch (error) {
      console.error("[v0] Error checking for new orders:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const user = getUserData()
      if (!user) return

      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/orders", {
          headers: { "x-user-id": user.id },
        }),
        fetch("/api/products", {
          headers: { "x-user-id": user.id },
        }),
      ])

      if (!ordersResponse.ok || !productsResponse.ok) {
        console.error("Analytics API error - Orders:", ordersResponse.status, "Products:", productsResponse.status)
        return
      }

      const ordersData = await ordersResponse.json()
      const productsData = await productsResponse.json()

      if (ordersData.success && productsData.success) {
        const orders = ordersData.orders || []
        const products = productsData.products || []

        setLastOrderCount(orders.length)

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
        const totalOrders = orders.length
        const activeProducts = products.filter((p) => p.in_stock && p.stock > 0).length

        const recentOrders = orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
          .map((order) => ({
            id: order.order_number ? order.order_number.toString().padStart(5, "0") : "00000",
            room: `Room ${order.room_number}`,
            amount: `${Number(order.total_amount || 0).toFixed(2)} MAD`,
            status: order.status || "pending",
          }))

        const productOrderCount = {}
        orders.forEach((order) => {
          if (order.items) {
            const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items
            items.forEach((item) => {
              productOrderCount[item.name] = (productOrderCount[item.name] || 0) + item.quantity
            })
          }
        })

        const topProducts = Object.entries(productOrderCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([name, orders], index) => {
            const product = products.find((p) => p.name === name)
            const revenue = orders * (product?.price || 0)
            return {
              name,
              orders,
              revenue: `${revenue.toFixed(2)} MAD`,
            }
          })

        setAnalytics({
          totalRevenue,
          totalOrders,
          activeProducts,
          storeViews: Math.floor(totalOrders * 3.2),
          recentOrders,
          topProducts,
        })
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotelData = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch(`/api/hotels/profile`, {
        headers: { "x-user-id": user.id },
      })
      const data = await response.json()

      if (data.hotel) {
        const hotelData = {
          ...data.hotel,
          logo_url: data.hotel.logo_url || null,
        }
        setHotelData(hotelData)
      } else {
        setHotelData({
          name: user.hotelName || "HotelTec",
          description: "Welcome to our hotel store",
          logo_url: null,
        })
      }
    } catch (error) {
      console.error("Error fetching hotel data:", error)
      const user = getUserData()
      setHotelData({
        name: user?.hotelName || "HotelTec",
        description: "Welcome to our hotel store",
        logo_url: null,
      })
    }
  }

  const fetchSupportStats = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch("/api/support-tickets", {
        headers: { "user-id": user.id },
      })

      if (response.ok) {
        const data = await response.json()
        const tickets = data.tickets || []

        const openTickets = tickets.filter(
          (ticket) => ticket.status === "open" || ticket.status === "in_progress",
        ).length
        const recentTickets = tickets
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
          .map((ticket) => ({
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            created_at: ticket.created_at,
          }))

        setSupportStats({
          openTickets,
          recentTickets,
        })
      }
    } catch (error) {
      console.error("Error fetching support stats:", error)
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "trial":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const shouldShowUpgradePrompt = () => {
    if (!subscription) return false
    if (subscription.status === "active" && subscription.plan_name !== "Free Trial") return false
    return (
      subscription.status === "trial" ||
      subscription.days_remaining <= 7 ||
      (subscription.max_products !== -1 && analytics.activeProducts >= subscription.max_products * 0.8)
    )
  }

  return (
    <div className="space-y-6">
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Welcome to HotelTec! Let's set up your store
            </DialogTitle>
            <DialogDescription>
              Complete your store information to provide the best experience for your guests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${step <= onboardingStep ? "bg-primary" : "bg-gray-200"}`}
                />
              ))}
            </div>

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="hotelName">Hotel Name</Label>
                    <Input
                      id="hotelName"
                      value={onboardingData.hotelName}
                      onChange={(e) => setOnboardingData({ ...onboardingData, hotelName: e.target.value })}
                      placeholder="Enter your hotel name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={onboardingData.description}
                      onChange={(e) => setOnboardingData({ ...onboardingData, description: e.target.value })}
                      placeholder="Brief description of your hotel"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={onboardingData.phone}
                      onChange={(e) => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={onboardingData.address}
                      onChange={(e) => setOnboardingData({ ...onboardingData, address: e.target.value })}
                      placeholder="Hotel address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website (Optional)
                    </Label>
                    <Input
                      id="website"
                      value={onboardingData.website}
                      onChange={(e) => setOnboardingData({ ...onboardingData, website: e.target.value })}
                      placeholder="https://yourhotel.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Hotel Logo</h3>
                <div className="space-y-3">
                  <Label htmlFor="logo" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo (Optional)
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setOnboardingData({ ...onboardingData, logoFile: file })
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload your hotel logo to personalize your store. Recommended size: 200x200px
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleSkipOnboarding}>
                Skip for now
              </Button>
              <div className="space-x-2">
                {onboardingStep > 1 && (
                  <Button variant="outline" onClick={() => setOnboardingStep(onboardingStep - 1)}>
                    Back
                  </Button>
                )}
                <Button onClick={handleOnboardingNext}>{onboardingStep === 3 ? "Complete Setup" : "Next"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {newOrderNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div
            className="bg-green-500 text-white p-4 rounded-lg shadow-lg border-2 border-green-400 min-w-[300px] cursor-pointer hover:bg-green-600 transition-colors"
            onClick={() => {
              setNewOrderNotification(null)
              router.push("/dashboard/orders")
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">New Order!</h4>
                  <p className="text-green-100">Order #{newOrderNotification.id}</p>
                  <p className="text-green-100 text-sm">
                    {newOrderNotification.room} • {newOrderNotification.amount}
                  </p>
                  <p className="text-green-200 text-xs">{newOrderNotification.timestamp}</p>
                  <p className="text-green-200 text-xs mt-1">Click to view order details</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setNewOrderNotification(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {subscription && shouldShowUpgradePrompt() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">
                    {subscription.status === "trial"
                      ? "Trial Ending Soon"
                      : subscription.days_remaining <= 7
                        ? "Subscription Expiring"
                        : "Approaching Product Limit"}
                  </h3>
                  <p className="text-sm text-orange-700">
                    {subscription.status === "trial"
                      ? `Your free trial expires in ${subscription.days_remaining} days`
                      : subscription.days_remaining <= 7
                        ? `Your subscription expires in ${subscription.days_remaining} days`
                        : `You're using ${analytics.activeProducts} of ${subscription.max_products} products`}
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/subscription">Upgrade Plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your hotel webstore performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRevenue.toFixed(2)} MAD</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Real-time</span> from your orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Live</span> order count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">In stock</span> and available
              {subscription && subscription.max_products !== -1 && (
                <span className="block">of {subscription.max_products} allowed</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">Pending</span> support requests
            </p>
          </CardContent>
        </Card>

        {subscription && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{subscription.plan_name}</div>
              <Badge className={`text-xs ${getSubscriptionStatusColor(subscription.status)}`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
              {subscription.is_active && subscription.days_remaining > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Time left</span>
                    <span>{subscription.days_remaining}d</span>
                  </div>
                  <Progress
                    value={Math.max(
                      0,
                      Math.min(100, (subscription.days_remaining / (subscription.duration_months * 30)) * 100),
                    )}
                    className="h-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.recentOrders.length > 0 ? (
              analytics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "preparing"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">Orders will appear here once guests start purchasing</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topProducts.length > 0 ? (
              analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-medium">{product.revenue}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No product data yet</p>
                <p className="text-sm">Top products will appear here based on orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Recent Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportStats.recentTickets.length > 0 ? (
              supportStats.recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm truncate max-w-[150px]">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      ticket.status === "resolved"
                        ? "default"
                        : ticket.status === "in_progress"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No support tickets</p>
                <p className="text-sm">Support requests will appear here</p>
              </div>
            )}
            {supportStats.recentTickets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => router.push("/dashboard/support")}
              >
                View All Tickets
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
