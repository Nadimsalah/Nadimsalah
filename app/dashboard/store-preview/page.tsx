"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Copy, ExternalLink, QrCode, Smartphone, Eye, Share2, Download, Upload, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Hotel {
  id: string
  name: string
  description: string
  logo_url: string
  slug: string
}

export default function StorePreviewPage() {
  const { toast } = useToast()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [storeUrl, setStoreUrl] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    logo_url: "",
  })
  const [analytics, setAnalytics] = useState({
    storeViews: "0",
    qrScans: "0",
    mobileOrders: "0%",
    conversionRate: "0%",
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const fetchHotelData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      const response = await fetch(`/api/hotels/profile`, {
        headers: {
          "x-user-id": user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHotel(data.hotel)
        setEditForm({
          name: data.hotel.name || "",
          description: data.hotel.description || "",
          logo_url: data.hotel.logo_url || "",
        })
        setLogoPreview(data.hotel.logo_url || "")
      }
    } catch (error) {
      console.error("Error fetching hotel data:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      const response = await fetch(`/api/analytics/store`, {
        headers: {
          "x-user-id": user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setEditLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      let logoUrl = editForm.logo_url

      // If user uploaded a new logo, upload it first
      if (logoFile) {
        const logoFormData = new FormData()
        logoFormData.append("logo", logoFile)

        const logoResponse = await fetch("/api/upload/logo", {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
          body: logoFormData,
        })

        if (logoResponse.ok) {
          const logoData = await logoResponse.json()
          logoUrl = logoData.logoUrl
        }
      }

      const response = await fetch(`/api/hotels/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          logo_url: logoUrl,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setHotel(data.hotel)
        setShowEditDialog(false)
        setLogoFile(null)
        window.dispatchEvent(new CustomEvent("hotelDataUpdated"))
        toast({
          title: "Success!",
          description: "Hotel profile updated successfully",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update hotel profile",
        variant: "destructive",
      })
    } finally {
      setEditLoading(false)
    }
  }

  useEffect(() => {
    fetchHotelData()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (hotel) {
      const slug =
        hotel.slug ||
        hotel.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      const url = `https://hoteltec.app/store/${slug}`
      console.log("[v0] Store Preview - Generated store URL:", url)
      console.log("[v0] Store Preview - Hotel slug:", slug)
      console.log("[v0] Store Preview - Hotel data:", hotel)
      setStoreUrl(url)
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(url)}`,
      )
    }
  }, [hotel])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Store link copied to clipboard",
      })
    } catch (err) {
      console.log("[v0] Copy error:", err)
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const downloadQRCode = async () => {
    try {
      setQrLoading(true)
      console.log("[v0] Downloading QR code from:", qrCodeUrl)
      const response = await fetch(qrCodeUrl)
      if (!response.ok) throw new Error("Failed to fetch QR code")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hotel-store-qr-${hotel?.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Downloaded!",
        description: "QR code saved to your device",
      })
    } catch (err) {
      console.log("[v0] Download error:", err)
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    } finally {
      setQrLoading(false)
    }
  }

  const handleQRImageLoad = () => {
    setQrError(false)
    console.log("[v0] QR code loaded successfully")
  }

  const handleQRImageError = () => {
    setQrError(true)
    console.log("[v0] QR code failed to load")
  }

  const regenerateQRCode = () => {
    setQrError(false)
    const timestamp = Date.now()
    setQrCodeUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(storeUrl)}&t=${timestamp}`,
    )
  }

  const stats = [
    {
      title: "Store Views",
      value: analyticsLoading ? "..." : analytics.storeViews,
      description: "Total visits this month",
      icon: Eye,
    },
    {
      title: "QR Scans",
      value: analyticsLoading ? "..." : analytics.qrScans,
      description: "Scans from room QR codes",
      icon: QrCode,
    },
    {
      title: "Mobile Orders",
      value: analyticsLoading ? "..." : analytics.mobileOrders,
      description: "Orders from mobile devices",
      icon: Smartphone,
    },
    {
      title: "Conversion Rate",
      value: analyticsLoading ? "..." : analytics.conversionRate,
      description: "Visitors who placed orders",
      icon: Share2,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Preview</h1>
          <p className="text-gray-600 mt-2">Preview your hotel store and share the link with guests</p>
        </div>
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Store Info
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Hotel Store</DialogTitle>
              <DialogDescription>Update your hotel name, description, and logo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="hotel-name">Hotel Name</Label>
                <Input
                  id="hotel-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter hotel name"
                />
              </div>
              <div>
                <Label htmlFor="hotel-description">Description</Label>
                <Textarea
                  id="hotel-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter hotel description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hotel-logo">Hotel Logo</Label>
                <div className="flex items-center space-x-4">
                  {logoPreview && logoPreview.trim() !== "" && (
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      id="hotel-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("hotel-logo")?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveProfile} disabled={editLoading} className="flex-1">
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hotel Info Card */}
      {hotel && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {hotel.logo_url && hotel.logo_url.trim() !== "" ? (
                <img
                  src={hotel.logo_url || "/placeholder.svg"}
                  alt={hotel.name}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-xs">No Logo</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{hotel.name}</h2>
                <p className="text-gray-600">{hotel.description || "No description available"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Store Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Your Store</span>
          </CardTitle>
          <CardDescription>Copy this link to share with guests or generate QR codes for rooms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input value={storeUrl} readOnly className="flex-1" />
            <Button onClick={() => copyToClipboard(storeUrl)} variant="outline" disabled={!storeUrl}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex space-x-2">
            {hotel && (
              <Link href={storeUrl} target="_blank">
                <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Store</span>
                </Button>
              </Link>
            )}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 bg-transparent" disabled={!storeUrl}>
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Code</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Hotel Store QR Code</DialogTitle>
                  <DialogDescription>
                    Scan this QR code to access your hotel store. Print and place in guest rooms.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    {qrError ? (
                      <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-100 rounded">
                        <QrCode className="w-16 h-16 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center mb-2">Failed to load QR code</p>
                        <Button onClick={regenerateQRCode} size="sm" variant="outline">
                          Try Again
                        </Button>
                      </div>
                    ) : qrCodeUrl && qrCodeUrl.trim() !== "" ? (
                      <img
                        src={qrCodeUrl || "/placeholder.svg"}
                        alt="Hotel Store QR Code"
                        className="w-64 h-64"
                        onLoad={handleQRImageLoad}
                        onError={handleQRImageError}
                      />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-100 rounded">
                        <QrCode className="w-16 h-16 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center">Loading QR code...</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Store URL:</p>
                    <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{storeUrl}</p>
                  </div>
                  <div className="flex space-x-2 w-full">
                    <Button
                      onClick={() => copyToClipboard(storeUrl)}
                      variant="outline"
                      className="flex-1"
                      disabled={!storeUrl}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </Button>
                    <Button onClick={downloadQRCode} className="flex-1" disabled={qrLoading || qrError || !qrCodeUrl}>
                      <Download className="w-4 h-4 mr-2" />
                      {qrLoading ? "Downloading..." : "Download QR"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Store Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Store Preview</span>
          </CardTitle>
          <CardDescription>This is how your store appears to guests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {hotel ? (
              <iframe src={storeUrl} className="w-full h-96" title="Store Preview" />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading store preview...</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            {hotel && (
              <Link href={storeUrl} target="_blank">
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Store
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <QrCode className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-2">Generate QR Codes</h3>
              <p className="text-sm text-gray-600">Create QR codes for each room linking to your store</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-2">Guest Orders</h3>
              <p className="text-sm text-gray-600">Guests scan QR codes to browse and order from their rooms</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Share2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-2">Share Link</h3>
              <p className="text-sm text-gray-600">Share the store link directly via messaging or email</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
