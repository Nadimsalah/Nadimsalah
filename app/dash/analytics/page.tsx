"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Users,
  Building,
  ShoppingCart,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  overview: any
  growth: any
  dailyRevenue: any[]
  topHotels: any[]
  orderStatus: any[]
  monthlyGrowth: any[]
  recentActivity: any[]
  timestamp: string
}

interface SystemHealth {
  healthChecks: any[]
  systemMetrics: any
  overallStatus: string
  timestamp: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
    fetchSystemHealth()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchAnalytics()
        fetchSystemHealth()
      },
      5 * 60 * 1000,
    )
    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/super-admin/analytics", {
        headers: {
          Authorization: "SuperAdmin token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Network error while fetching analytics",
        variant: "destructive",
      })
    }
  }

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch("/api/super-admin/system-health", {
        headers: {
          Authorization: "SuperAdmin token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error("Error fetching system health:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchAnalytics(), fetchSystemHealth()])
    setRefreshing(false)
    toast({
      title: "Data refreshed",
      description: "Analytics data has been updated",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Monitoring</h1>
          <p className="text-muted-foreground">Platform performance and system health overview</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={
              systemHealth?.overallStatus === "healthy"
                ? "text-green-600 border-green-200"
                : "text-yellow-600 border-yellow-200"
            }
          >
            {systemHealth?.overallStatus === "healthy" ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1" />
            )}
            System {systemHealth?.overallStatus || "Unknown"}
          </Badge>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building className="w-4 h-4 text-blue-600" />
              Total Hotels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.total_hotels || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />+{analyticsData?.growth.new_hotels_30d || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-green-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.total_users || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />+{analyticsData?.growth.new_users_30d || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />+{analyticsData?.growth.new_orders_30d || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number.parseFloat(analyticsData?.overview.total_revenue || "0"))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {formatCurrency(Number.parseFloat(analyticsData?.growth.revenue_30d || "0"))} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Daily Revenue (Last 30 Days)
            </CardTitle>
            <CardDescription>Revenue trends over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData?.dailyRevenue.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">{formatDate(day.date)}</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(Number.parseFloat(day.revenue))}</div>
                    <div className="text-muted-foreground text-xs">{day.order_count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Hotels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Hotels
            </CardTitle>
            <CardDescription>Hotels ranked by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData?.topHotels.slice(0, 5).map((hotel, index) => (
                <div key={hotel.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{hotel.name}</div>
                      <div className="text-muted-foreground text-xs">{hotel.order_count} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(Number.parseFloat(hotel.revenue))}</div>
                    <div className="text-muted-foreground text-xs">{hotel.product_count} products</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform activity (Last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData?.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "hotel"
                        ? "bg-blue-500"
                        : activity.type === "order"
                          ? "bg-green-500"
                          : "bg-purple-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-muted-foreground text-xs">{activity.description}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      {systemHealth?.healthChecks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              System Health Monitor
            </CardTitle>
            <CardDescription>Real-time system component status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemHealth.healthChecks.map((check, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{check.service}</span>
                    <div className="flex items-center gap-2">
                      {check.status === "healthy" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm ${check.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
                        {check.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{check.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>Breakdown of order statuses across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData?.orderStatus.map((status, index) => (
              <div key={index} className="p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold mb-1">{status.count}</div>
                <div className="text-muted-foreground text-sm capitalize mb-2">{status.status} Orders</div>
                <div className="font-medium">{formatCurrency(Number.parseFloat(status.revenue))}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
