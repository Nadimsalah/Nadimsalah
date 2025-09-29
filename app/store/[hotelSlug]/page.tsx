"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ShoppingCart, Star, Plus, Loader2, Search, Phone, Mail, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  video_url?: string
  category: string
  rating: number
  in_stock: boolean
}

interface Hotel {
  id: string
  name: string
  description?: string
  logo_url?: string
  phone?: string
  email?: string
  address?: string
  store_color?: string
  currency?: string
}

interface CartItem extends Product {
  quantity: number
}

export default function HotelStorePage({ params }: { params: { hotelSlug: string } }) {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const storeColor = hotel?.store_color || "#8b5cf6"

  useEffect(() => {
    if (hotel?.store_color) {
      document.documentElement.style.setProperty("--store-primary", hotel.store_color)
      document.documentElement.style.setProperty("--store-primary-rgb", hexToRgb(hotel.store_color))
    }
  }, [hotel?.store_color])

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)}`
      : "139, 92, 246" // fallback purple RGB
  }

  useEffect(() => {
    async function fetchStoreData() {
      try {
        console.log("[v0] Client: Fetching store data for slug:", params.hotelSlug)
        setLoading(true)
        setError(null)

        const productsResponse = await fetch(`/api/hotels/${params.hotelSlug}/products`, {
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        })

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          console.log("[v0] Client: Products API response data:", productsData)

          if (productsData?.success) {
            if (productsData.hotel) {
              setHotel(productsData.hotel)
              console.log("[v0] Client: Hotel data set:", productsData.hotel)
            }
            if (Array.isArray(productsData.products)) {
              setProducts(productsData.products)
              console.log("[v0] Client: Products data set:", productsData.products.length, "products")
            }
          } else {
            throw new Error(productsData?.message || "Failed to load store data")
          }
        } else {
          throw new Error("Failed to fetch products")
        }
      } catch (err) {
        console.error("[v0] Client: Error fetching store data:", err)
        setError(err instanceof Error ? err.message : "Failed to load store data")
      } finally {
        setLoading(false)
      }
    }

    fetchStoreData()
  }, [params.hotelSlug])

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${params.hotelSlug}`)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      } catch (error) {
        console.error("[v0] Error loading cart from localStorage:", error)
      }
    }
  }, [params.hotelSlug])

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart_${params.hotelSlug}`, JSON.stringify(cart))
    } else {
      localStorage.removeItem(`cart_${params.hotelSlug}`)
    }
  }, [cart, params.hotelSlug])

  const addToCart = async (product: Product) => {
    setAddingToCart(product.id)

    await new Promise((resolve) => setTimeout(resolve, 300))

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })

    setAddingToCart(null)
  }

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: storeColor }} />
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-destructive mb-2">Store Unavailable</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-2xl bg-white">
              <div
                className="relative w-full h-full rounded-full overflow-hidden border-4"
                style={{ borderColor: `${storeColor}33` }}
              >
                {hotel?.logo_url ? (
                  <Image
                    src={hotel.logo_url || "/placeholder.svg"}
                    alt={`${hotel?.name || "Hotel"} Profile Picture`}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      console.log("[v0] Client: Hotel profile picture failed to load:", hotel.logo_url)
                      const target = e.target as HTMLImageElement
                      target.src =
                        "/placeholder.svg?height=128&width=128&text=" +
                        encodeURIComponent(hotel?.name?.charAt(0) || "H")
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: storeColor }}
                  >
                    {hotel?.name?.charAt(0) || "H"}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{hotel?.name || "Hotel Store"}</h1>
            <p className="text-muted-foreground mb-4">{hotel?.description || "Premium room service & amenities"}</p>

            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              {hotel?.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{hotel.phone}</span>
                </div>
              )}
              {hotel?.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{hotel.email}</span>
                </div>
              )}
              {hotel?.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border h-12 text-base"
            />
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category ? "text-white shadow-lg" : "hover:bg-secondary/10"
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? storeColor : "transparent",
                  borderColor: selectedCategory === category ? storeColor : undefined,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {category === "all" ? "All Items" : category}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Our Products</h2>
              <p className="text-muted-foreground">Curated selection of premium items</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary font-medium px-4 py-2">
                {filteredProducts.length} items
              </Badge>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {searchQuery || selectedCategory !== "all" ? "No Products Found" : "No Products Available"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or category filter."
                    : `${hotel?.name || "This hotel"} is currently updating their menu. Please check back soon.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.video_url ? (
                      <video
                        src={product.video_url}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={product.image_url || "/placeholder.svg?height=300&width=300"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge
                          variant="destructive"
                          className="bg-destructive text-destructive-foreground font-medium text-xs"
                        >
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className="bg-background/90 text-foreground border-border font-medium text-xs"
                      >
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-sm md:text-lg font-semibold text-foreground mb-1 line-clamp-1">
                      {product.name}
                    </CardTitle>
                    {product.description && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg md:text-xl font-bold" style={{ color: storeColor }}>
                        {getCurrencySymbol(hotel?.currency || "USD")}
                        {product.price}
                      </span>
                      {product.rating > 0 && (
                        <div className="flex items-center space-x-1 bg-secondary/10 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          <span className="text-xs font-medium text-foreground">{product.rating}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className={`w-full font-medium py-2 text-xs md:text-sm transition-all duration-300 text-white ${
                        addingToCart === product.id ? "bg-green-500 hover:bg-green-600 scale-105" : "hover:opacity-90"
                      }`}
                      style={{
                        backgroundColor: addingToCart === product.id ? "#10b981" : storeColor,
                      }}
                      disabled={!product.in_stock || addingToCart === product.id}
                      onClick={() => addToCart(product)}
                    >
                      {addingToCart === product.id ? (
                        <>
                          <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {cartItemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="text-white font-medium shadow-2xl hover:shadow-3xl transition-all duration-300 animate-bounce rounded-full px-6 py-4 hover:opacity-90"
            style={{ backgroundColor: storeColor }}
            onClick={() => {
              window.location.href = `/store/${params.hotelSlug}/checkout`
            }}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            <span className="font-semibold">Cart ({cartItemCount})</span>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {cartItemCount}
            </div>
          </Button>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function getCurrencySymbol(currency: string): string {
  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    MAD: "MAD ",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF ",
    CNY: "¥",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    RUB: "₽",
    INR: "₹",
    BRL: "R$",
    ZAR: "R",
    KRW: "₩",
    TRY: "₺",
    MXN: "$",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
    THB: "฿",
    MYR: "RM",
    IDR: "Rp",
    PHP: "₱",
    VND: "₫",
    AED: "AED ",
    SAR: "SAR ",
    QAR: "QAR ",
    KWD: "KWD ",
    BHD: "BHD ",
    OMR: "OMR ",
    JOD: "JOD ",
    EGP: "EGP ",
    TND: "TND ",
    DZD: "DZD ",
    NGN: "₦",
    KES: "KSh",
    GHS: "GH₵",
    ETB: "Br",
    UGX: "USh",
    TZS: "TSh",
    MUR: "₨",
    BWP: "P",
    NAD: "N$",
    ZMW: "ZK",
    MWK: "MK",
    AOA: "Kz",
    MZN: "MT",
    XAF: "FCFA ",
    XOF: "CFA ",
    BDT: "৳",
    PKR: "₨",
    LKR: "₨",
    NPR: "₨",
    BTN: "Nu.",
    MVR: "Rf",
    AFN: "؋",
    IRR: "﷼",
    IQD: "IQD ",
    SYP: "£",
    YER: "﷼",
    GEL: "₾",
    AMD: "֏",
    AZN: "₼",
    KZT: "₸",
    KGS: "с",
    TJS: "ЅМ",
    TMT: "T",
    UZS: "сўм",
    MNT: "₮",
    TWD: "NT$",
    FJD: "FJ$",
    PGK: "K",
    SBD: "SI$",
    VUV: "VT",
    WST: "WS$",
    TOP: "T$",
    CLP: "$",
    ARS: "$",
    UYU: "$U",
    PYG: "₲",
    BOB: "Bs",
    PEN: "S/",
    COP: "$",
    VES: "Bs.S",
    GYD: "GY$",
    SRD: "Sr$",
    TTD: "TT$",
    JMD: "J$",
    BBD: "Bds$",
    BSD: "B$",
    BZD: "BZ$",
    GTQ: "Q",
    HNL: "L",
    NIO: "C$",
    CRC: "₡",
    PAB: "B/.",
    CUP: "$",
    DOP: "RD$",
    HTG: "G",
    LBP: "ل.ل",
    LYD: "LD",
    ISK: "kr",
    RON: "lei",
    BGN: "лв",
    HRK: "kn",
    ILS: "₪",
    LAK: "₭",
    KHR: "៛",
    MMK: "K",
    SZL: "E",
    LSL: "L",
    ZWL: "Z$",
  }

  return currencySymbols[currency] || currency + " "
}
