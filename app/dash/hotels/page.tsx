"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building, Search, Eye, Mail, Phone, MapPin, Calendar, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

interface Hotel {
  id: string
  name: string
  description: string
  logo_url: string
  contact_number: string
  address: string
  facebook_url: string
  instagram_url: string
  twitter_url: string
  linkedin_url: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  email: string
  role: string
  owner_created_at: string
  product_count: number
  order_count: number
  story_count: number
}

export default function HotelsManagement() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchHotels()
  }, [])

  useEffect(() => {
    const filtered = hotels.filter(
      (hotel) =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${hotel.first_name} ${hotel.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredHotels(filtered)
  }, [hotels, searchTerm])

  const fetchHotels = async () => {
    try {
      const user = localStorage.getItem("user")
      if (!user) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const userData = JSON.parse(user)
      if (userData.role !== "super_admin") {
        toast({
          title: "Error",
          description: "Super admin access required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/super-admin/hotels", {
        headers: {
          Authorization: "SuperAdmin token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHotels(data.hotels)
        setFilteredHotels(data.hotels)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch hotels",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching hotels:", error)
      toast({
        title: "Error",
        description: "Network error while fetching hotels",
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
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotels...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Hotel Management</h1>
        <p className="text-muted-foreground">Manage all hotel accounts on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotels.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Active</span> hotel accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search hotels, owners, or email addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHotels.map((hotel) => (
          <Card key={hotel.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
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
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{hotel.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {hotel.first_name} {hotel.last_name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Owner Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{hotel.email}</span>
                </div>
                {hotel.contact_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{hotel.contact_number}</span>
                  </div>
                )}
                {hotel.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{hotel.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {formatDate(hotel.created_at)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">{hotel.product_count}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{hotel.order_count}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{hotel.story_count}</div>
                  <div className="text-xs text-muted-foreground">Stories</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Link href={`/dash/hotels/${hotel.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`https://hoteltec.app/${hotel.name.toLowerCase().replace(/\s+/g, "-")}`, "_blank")
                  }
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredHotels.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "No hotels have been registered yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
