"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CreditCard, Wallet } from "lucide-react"
import Image from "next/image"
import type { CartItem } from "@/types/cartItem"

interface Hotel {
  name: string
  description: string
  logo_url: string
}

export default function CheckoutPage({ params }: { params: { hotelSlug: string } }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [hotel, setHotel] = useState<Hotel>({
    name: "Grand Hotel Boutique",
    description: "Welcome to our hotel store",
    logo_url: "",
  })
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    roomNumber: "",
    phoneNumber: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCartFromStorage()
    fetchHotelInfo()
  }, [])

  const fetchHotelInfo = async () => {
    try {
      const response = await fetch(`/api/hotels/${params.hotelSlug}/products`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.hotel) {
          setHotel({
            name: data.hotel.name || "Grand Hotel Boutique",
            description: data.hotel.description || "Welcome to our hotel store",
            logo_url: data.hotel.logo_url || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching hotel info:", error)
    }
  }

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem(`cart_${params.hotelSlug}`)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        const validatedCart = parsedCart.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image_url || item.image,
          description: item.description,
          category: item.category,
          rating: item.rating,
          in_stock: item.in_stock,
        }))
        setCart(validatedCart)
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmitOrder = async () => {
    if (!guestInfo.name || !guestInfo.roomNumber || !guestInfo.phoneNumber) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        hotel_slug: params.hotelSlug,
        guest_name: guestInfo.name,
        room_number: guestInfo.roomNumber,
        phone_number: guestInfo.phoneNumber,
        payment_method: paymentMethod,
        items: cart,
        total_amount: totalPrice,
      }

      console.log("[v0] Submitting order:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      console.log("[v0] Order response:", result)

      if (response.ok && result.success) {
        localStorage.removeItem(`cart_${params.hotelSlug}`)
        window.location.href = `/store/${params.hotelSlug}/thank-you`
      } else {
        throw new Error(result.message || "Failed to submit order")
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("Failed to submit order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    window.location.href = `/store/${params.hotelSlug}`
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={goBack} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="p-2 hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-card-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center space-x-4">
                <div className="w-14 h-14 relative flex-shrink-0 rounded-xl overflow-hidden">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-card-foreground">{item.name}</h3>
                  <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base text-card-foreground">
                    {(item.price * item.quantity).toFixed(2)} MAD
                  </p>
                </div>
              </div>
            ))}
            <Separator className="bg-border" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-card-foreground">Total</span>
              <span className="text-accent">{totalPrice.toFixed(2)} MAD</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-card-foreground">Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-card-foreground">
                Full Name *
              </Label>
              <Input
                id="name"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-2 h-12 bg-muted border-border focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <Label htmlFor="room" className="text-sm font-semibold text-card-foreground">
                Room Number *
              </Label>
              <Input
                id="room"
                value={guestInfo.roomNumber}
                onChange={(e) => setGuestInfo({ ...guestInfo, roomNumber: e.target.value })}
                placeholder="Enter your room number"
                className="mt-2 h-12 bg-muted border-border focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-card-foreground">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={guestInfo.phoneNumber}
                onChange={(e) => setGuestInfo({ ...guestInfo, phoneNumber: e.target.value })}
                placeholder="Enter your phone number"
                className="mt-2 h-12 bg-muted border-border focus:ring-2 focus:ring-accent"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-card-foreground">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                paymentMethod === "cash" ? "border-accent bg-accent/5" : "border-border bg-card"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              <div className="flex items-center space-x-4">
                <Wallet className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-card-foreground">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                </div>
              </div>
            </div>
            <div
              className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                paymentMethod === "card" ? "border-accent bg-accent/5" : "border-border bg-card"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <div className="flex items-center space-x-4">
                <CreditCard className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-card-foreground">Credit/Debit Card</p>
                  <p className="text-sm text-muted-foreground">Pay now with your card</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-5 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Placing Order..." : `Place Order - ${totalPrice.toFixed(2)} MAD`}
        </Button>
      </div>
    </div>
  )
}
