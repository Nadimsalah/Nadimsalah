"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Phone } from "lucide-react"

interface Hotel {
  name: string
  description: string
  logo_url: string
  contact_number?: string
}

export default function ThankYouPage({ params }: { params: { hotelSlug: string } }) {
  const [hotel, setHotel] = useState<Hotel>({
    name: "Grand Hotel Boutique",
    description: "Welcome to our hotel store",
    logo_url: "",
  })

  useEffect(() => {
    fetchHotelInfo()
  }, [])

  const fetchHotelInfo = async () => {
    try {
      const response = await fetch(`/api/hotels/${params.hotelSlug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.hotel) {
          setHotel({
            name: data.hotel.name || "Grand Hotel Boutique",
            description: data.hotel.description || "Welcome to our hotel store",
            logo_url: data.hotel.logo_url || "",
            contact_number: data.hotel.contact_number || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching hotel info:", error)
    }
  }

  const goBackToStore = () => {
    window.location.href = `/store/${params.hotelSlug}`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center border border-border shadow-lg">
          <CardContent className="pt-10 pb-10">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-foreground mb-3">Order Confirmed!</h1>
              <p className="text-muted-foreground text-lg">Thank you for your order from {hotel.name}</p>
            </div>

            <div className="bg-muted rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center space-x-3 text-foreground mb-3">
                <Clock className="w-5 h-5" />
                <span className="text-base font-semibold">Estimated Delivery</span>
              </div>
              <p className="text-2xl font-bold text-accent">15-30 minutes</p>
            </div>

            {hotel.contact_number && (
              <div className="bg-accent/10 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center space-x-3 text-accent mb-3">
                  <Phone className="w-5 h-5" />
                  <span className="text-base font-semibold">Need Help?</span>
                </div>
                <p className="text-xl font-bold text-accent">{hotel.contact_number}</p>
                <p className="text-sm text-muted-foreground mt-2">Call us for any questions about your order</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={goBackToStore}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-4 text-lg font-semibold rounded-xl"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
