"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Building,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  CalendarIcon,
} from "lucide-react"
import { format } from "date-fns"

export default function SuperAdminDashboard() {
  const [analytics, setAnalytics] = useState({
    totalHotels: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeStores: 0,
    recentActivity: [],
    topHotels: [],
  })
  const [earnings, setEarnings] = useState({
    today: 0,
    yesterday: 0,
    week: 0,
    year: 0,
    custom: 0,
    earningsByHotel: [],
    dailyEarnings: [],
  })
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    fetchEarnings("today")
    fetchEarnings("yesterday")
    fetchEarnings("week")
    fetchEarnings("year")
  }, [])

  const fetchEarnings = async (period, startDate = null, endDate = null) => {
    try {
      let url = `/api/super-admin/earnings?period=${period}`
      if (startDate && endDate) {
        url = `/api/super-admin/earnings?startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (period === "custom") {
        setEarnings((prev) => ({
          ...prev,
          custom: data.totalEarnings || 0,
          earningsByHotel: data.earningsByHotel || [],
          dailyEarnings: data.dailyEarnings || [],
        }))
      } else {
        setEarnings((prev) => ({
          ...prev,
          [period]: data.totalEarnings || 0,
          earningsByHotel: data.earningsByHotel || [],
          dailyEarnings: data.dailyEarnings || [],
        }))
      }
    } catch (error) {
      console.error(`Error fetching ${period} earnings:`, error)
      if (period === "custom") {
        setEarnings((prev) => ({
          ...prev,
          custom: 0,
          earningsByHotel: [],
          dailyEarnings: [],
        }))
      } else {
        setEarnings((prev) => ({
          ...prev,
          [period]: 0,
          earningsByHotel: [],
          dailyEarnings: [],
        }))
      }
    }
  }

  const handleDateRangeSelect = (range) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      const startDate = format(range.from, "yyyy-MM-dd")
      const endDate = format(range.to, "yyyy-MM-dd")
      fetchEarnings("custom", startDate, endDate)
      setSelectedPeriod("custom")
      setCalendarOpen(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [hotelsResponse, analyticsResponse] = await Promise.all([
        fetch("/api/super-admin/hotels"),
        fetch("/api/super-admin/analytics"),
      ])

      const hotelsData = await hotelsResponse.json()
      const analyticsData = await analyticsResponse.json()

      if (hotelsData.success && analyticsData.success) {
        const hotels = hotelsData.hotels || []
        const stats = analyticsData.stats || {}

        setAnalytics({
          totalHotels: hotels.length,
          totalOrders: stats.totalOrders || 0,
          totalRevenue: stats.totalRevenue || 0,
          activeStores: hotels.filter((h) => h.status === "active").length,
          recentActivity: stats.recentActivity || [],
          topHotels: hotels.slice(0, 4).map((hotel) => ({
            name: hotel.name,
            orders: hotel.total_orders || 0,
            revenue: `${(hotel.total_revenue || 0).toFixed(2)} MAD`,
          })),
        })
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setAnalytics({
        totalHotels: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeStores: 0,
        recentActivity: [],
        topHotels: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage the HotelTec SaaS platform performance.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Earnings Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                      : "Custom Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="range" selected={dateRange} onSelect={handleDateRangeSelect} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPeriod === "today" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedPeriod("today")}
            >
              <div className="text-2xl font-bold text-black">{(earnings.today || 0).toFixed(2)} MAD</div>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPeriod === "yesterday" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedPeriod("yesterday")}
            >
              <div className="text-2xl font-bold text-black">{(earnings.yesterday || 0).toFixed(2)} MAD</div>
              <p className="text-sm text-muted-foreground">Yesterday</p>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPeriod === "week" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedPeriod("week")}
            >
              <div className="text-2xl font-bold text-black">{(earnings.week || 0).toFixed(2)} MAD</div>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPeriod === "year" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedPeriod("year")}
            >
              <div className="text-2xl font-bold text-black">{(earnings.year || 0).toFixed(2)} MAD</div>
              <p className="text-sm text-muted-foreground">This Year</p>
            </div>
            {dateRange?.from && dateRange?.to && (
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPeriod === "custom" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedPeriod("custom")}
              >
                <div className="text-2xl font-bold text-black">{(earnings.custom || 0).toFixed(2)} MAD</div>
                <p className="text-sm text-muted-foreground">Custom Range</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHotels}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Active</span> hotel accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.totalRevenue || 0).toFixed(2)} MAD</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Total</span> across all hotels
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
              <span className="text-blue-600">Platform-wide</span> order count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeStores}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Live</span> hotel stores
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">{activity.hotel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Platform activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Performing Hotels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topHotels.length > 0 ? (
              analytics.topHotels.map((hotel, index) => (
                <div key={hotel.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{hotel.name}</p>
                      <p className="text-sm text-muted-foreground">{hotel.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-medium">{hotel.revenue}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hotel data yet</p>
                <p className="text-sm">Top hotels will appear here based on performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Database</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">API Services</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">File Storage</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
