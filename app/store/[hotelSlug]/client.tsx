"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart, Plus, Minus } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  rating: number
  in_stock: boolean
}

interface Hotel {
  id: string
  name: string
  description?: string
  logo_url?: string
}

interface Story {
  id: string
  title: string
  description: string
  image_url: string
  video_url?: string
  created_at: string
}

interface CartItem extends Product {
  quantity: number
}

interface HotelStoreClientProps {
  initialHotel: Hotel | null
  initialProducts: Product[]
  initialStories: Story[]
  hotelSlug: string
}

export function HotelStoreClient({ initialHotel, initialProducts, initialStories, hotelSlug }: HotelStoreClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const addToCart = (product: Product) => {
    if (!product?.id || !product.in_stock) return

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, change: number) => {
    if (!productId) return

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = Math.max(0, item.quantity + change)
            return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    })
  }

  const categories = ["All", ...new Set(initialProducts.filter((p) => p?.category).map((p) => p.category))]
  const filteredProducts =
    selectedCategory === "All" ? initialProducts : initialProducts.filter((p) => p?.category === selectedCategory)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {initialHotel?.logo_url && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={initialHotel.logo_url || "/placeholder.svg"}
                    alt={`${initialHotel.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {initialHotel?.name || hotelSlug.replace("-", " ")} Store
                </h1>
                <p className="text-sm text-gray-600">Fresh delivery • 15-30 min</p>
              </div>
            </div>

            {cartItemCount > 0 && (
              <div className="relative">
                <Button className="bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart ({cartItemCount})
                </Button>
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white px-2 py-1">
                  ${cartTotal.toFixed(2)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {initialStories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Stories</h2>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {initialStories.map((story) => (
                <div key={story.id} className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5 mb-2">
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <img
                        src={story.image_url || "/placeholder.svg?height=60&width=60"}
                        alt={story.title}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=60&width=60"
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 w-16 truncate">{story.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.length > 1 && (
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex-shrink-0 min-w-fit"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No Products Available</h3>
                <p className="text-gray-600">
                  {selectedCategory === "All"
                    ? "This store hasn't added any products yet."
                    : `No products found in "${selectedCategory}" category.`}
                </p>
                {selectedCategory !== "All" && (
                  <Button variant="outline" onClick={() => setSelectedCategory("All")} className="mt-4">
                    View All Products
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id)

              return (
                <Card key={product.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                            <div className="flex items-center space-x-3 mb-3">
                              {product.rating > 0 && (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm ml-1 text-gray-700">{product.rating.toFixed(1)}</span>
                                </div>
                              )}
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {product.category}
                              </Badge>
                              {!product.in_stock && <Badge variant="destructive">Out of Stock</Badge>}
                            </div>

                            <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {cartItem ? (
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-8 h-8 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="font-semibold text-lg min-w-[2rem] text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-8 h-8 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={!product.in_stock}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                            >
                              {product.in_stock ? "Add to Cart" : "Out of Stock"}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="w-24 h-24 m-4 flex-shrink-0">
                        <img
                          src={
                            product.image_url ||
                            `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                          }
                          alt={product.name}
                          className="w-full h-full rounded-lg object-cover bg-gray-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(product.name)}`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
