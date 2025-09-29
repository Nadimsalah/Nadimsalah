"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Users, ArrowLeft, Mail, Phone, MapPin, Calendar, ExternalLink, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface HotelDetail {
  hotel: any
  stats: any
  recentOrders: any[]
  recentProducts: any[]
}

export default function HotelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [hotelData, setHotelData] = useState<HotelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      fetchHotelDetail(params.id as string)
    }
  }, [params.id])

  const fetchHotelDetail = async (hotelId: string) => {
    try {
      const response = await fetch(`/api/super-admin/hotels/${hotelId}`, {
        headers: {
          Authorization: "SuperAdmin token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHotelData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch hotel details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching hotel detail:", error)
      toast({
        title: "Error",
        description: "Network error while fetching hotel details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading hotel details...</div>
        </div>
      </div>
    )
  }

  if (!hotelData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Hotel not found</div>
        </div>
      </div>
    )
  }

  const { hotel, stats, recentOrders, recentProducts } = hotelData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
          <p className="text-muted-foreground">Hotel Details & Analytics</p>
        </div>
        <Button
          variant="outline"
          className="bg-transparent"
          onClick={() => window.open(`https://hoteltec.app/${hotel.name.toLowerCase().replace(/\s+/g, "-")}`, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Store
        </Button>
      </div>

      {/* Hotel Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {hotel.logo_url ? (
                  <Image
                    src={hotel.logo_url || "/placeholder.svg"}
                    alt={hotel.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              {hotel.name}
            </CardTitle>
            <CardDescription>{hotel.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{hotel.email}</span>
                  </div>
                  {hotel.contact_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{hotel.contact_number}</span>
                    </div>
                  )}
                  {hotel.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{hotel.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Account Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      Owner: {hotel.first_name} {hotel.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(hotel.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Updated: {formatDate(hotel.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{stats.product_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-medium">{stats.total_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(Number.parseFloat(stats.total_revenue))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Stories</span>
                <span className="font-medium">{stats.active_stories}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{order.order_number}</span>
                        <Badge
                          variant={order.status === "delivered" ? "default" : "secondary"}
                          className={
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{order.guest_name}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number.parseFloat(order.total_amount))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Latest products added</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{product.name}</span>
                        <Badge
                          variant={product.in_stock ? "default" : "secondary"}
                          className={product.in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{product.category}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(product.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number.parseFloat(product.price))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent products</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
