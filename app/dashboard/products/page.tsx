"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Package, Search, Filter, Upload, X, Crown, Video } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", stock: "", description: "" })

  const getUserData = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchSubscriptionStatus()
  }, [])

  useEffect(() => {
    if (isAddDialogOpen || isEditDialogOpen) {
      fetchCategories()
    }
  }, [isAddDialogOpen, isEditDialogOpen])

  const fetchSubscriptionStatus = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch("/api/subscriptions/status", {
        headers: {
          "x-user-id": user.id,
        },
      })
      const data = await response.json()

      if (data.success) {
        setSubscription(data.subscription)
        console.log("[v0] Current subscription:", data.subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view products",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/products", {
        headers: {
          "x-user-id": user.id,
        },
      })
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch("/api/categories", {
        headers: {
          "x-user-id": user.id,
        },
      })
      const data = await response.json()

      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processVideoFile(file)
    }
  }

  const processVideoFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a video smaller than 50MB.",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      })
      return
    }

    setSelectedVideo(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setVideoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setIsUploadingVideo(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setVideoPreview(data.url)
        toast({
          title: "Video uploaded",
          description: "Your video has been uploaded successfully.",
        })
      } else {
        throw new Error(data.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      })
      setSelectedVideo(null)
      setVideoPreview(null)
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      processImageFile(file)
    }
  }

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const categoryName = newCategory.trim()
      setCategories([...categories, categoryName])
      setNewProduct({ ...newProduct, category: categoryName })
      setNewCategory("")
      setIsAddingCategory(false)

      try {
        const user = getUserData()
        if (user) {
          await fetch("/api/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.id,
            },
            body: JSON.stringify({ category: categoryName }),
          })
        }
      } catch (error) {
        console.error("Error persisting category:", error)
      }

      toast({
        title: "Category added",
        description: `"${categoryName}" has been added to categories.`,
      })
    }
  }

  const handleAddProduct = async () => {
    if (isAddingProduct) return

    if (products.length >= 5) {
      router.push("/checkout?plan=upgrade&reason=product-limit")
      return
    }

    if (!newProduct.name.trim()) {
      toast({
        title: "Missing product name",
        description: "Please enter a product name.",
        variant: "destructive",
      })
      return
    }

    if (!newProduct.category) {
      toast({
        title: "Missing category",
        description: "Please select or create a category.",
        variant: "destructive",
      })
      return
    }

    if (!newProduct.price || Number.parseFloat(newProduct.price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      })
      return
    }

    if (!newProduct.stock || Number.parseInt(newProduct.stock) < 0) {
      toast({
        title: "Invalid stock",
        description: "Please enter a valid stock quantity.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingProduct(true)
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add products",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          description: newProduct.description,
          image: imagePreview,
          video: videoPreview,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchProducts()
        await fetchCategories()

        setNewProduct({ name: "", category: "", price: "", stock: "", description: "" })
        setSelectedImage(null)
        setImagePreview(null)
        setSelectedVideo(null)
        setVideoPreview(null)
        setIsAddDialogOpen(false)

        toast({
          title: "Product added",
          description: `"${data.product.name}" has been added to your inventory.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsAddingProduct(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock?.toString() || "0",
      description: product.description || "",
    })
    setImagePreview(product.image_url || null)
    setVideoPreview(product.video_url || null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || isUpdatingProduct) return

    if (!newProduct.name.trim()) {
      toast({
        title: "Missing product name",
        description: "Please enter a product name.",
        variant: "destructive",
      })
      return
    }

    if (!newProduct.category) {
      toast({
        title: "Missing category",
        description: "Please select or create a category.",
        variant: "destructive",
      })
      return
    }

    if (!newProduct.price || Number.parseFloat(newProduct.price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingProduct(true)
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to update products",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock || "0",
          description: newProduct.description,
          image: imagePreview,
          video: videoPreview,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchProducts()
        setNewProduct({ name: "", category: "", price: "", stock: "", description: "" })
        setSelectedImage(null)
        setImagePreview(null)
        setSelectedVideo(null)
        setVideoPreview(null)
        setIsEditDialogOpen(false)
        setEditingProduct(null)

        toast({
          title: "Product updated",
          description: `"${data.product.name}" has been updated.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProduct(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete products",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      })

      const data = await response.json()

      if (data.success) {
        await fetchProducts()
        toast({
          title: "Product deleted",
          description: `"${product.name}" has been deleted.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const removeVideo = () => {
    setSelectedVideo(null)
    setVideoPreview(null)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const getProductStatus = (product) => {
    if (!product.in_stock || product.stock === 0) {
      return "out_of_stock"
    } else if (product.stock <= 5) {
      return "low_stock"
    } else {
      return "active"
    }
  }

  const getStatusBadge = (product) => {
    const status = getProductStatus(product)
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "low_stock":
        return <Badge variant="secondary">Low Stock</Badge>
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your hotel webstore products and inventory.</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={products.length >= 5 ? "destructive" : "default"}>Free Account</Badge>
            <span className="text-sm text-muted-foreground">{products.length}/5 products used</span>
            {products.length >= 5 && (
              <span className="text-sm text-orange-600 font-medium">Upgrade to add more products</span>
            )}
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                if (products.length >= 5) {
                  router.push("/checkout?plan=upgrade&reason=product-limit")
                  return
                }
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4" />
              Add Product
              {products.length >= 4 && <Crown className="w-4 h-4 ml-1 text-yellow-500" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your hotel webstore. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product Image</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Product preview"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`w-full h-32 mx-auto border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        isDragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <Upload className={`h-8 w-8 mb-2 ${isDragOver ? "text-primary" : "text-muted-foreground/50"}`} />
                      <p className={`text-sm text-center ${isDragOver ? "text-primary" : "text-muted-foreground"}`}>
                        {isDragOver ? "Drop image here" : "Drag & drop an image or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground/75 mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Recommended: 400x400px, max 5MB</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Product Video (Optional)</Label>
                <div className="flex flex-col gap-3">
                  {videoPreview ? (
                    <div className="relative w-full mx-auto">
                      <video src={videoPreview} controls className="w-full h-48 object-cover rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeVideo}
                        disabled={isUploadingVideo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="w-full h-32 mx-auto border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-muted-foreground/50"
                      onClick={() => document.getElementById("video-upload")?.click()}
                    >
                      <Video className="h-8 w-8 mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-center text-muted-foreground">Click to upload a product video</p>
                      <p className="text-xs text-muted-foreground/75 mt-1">MP4, WebM up to 50MB</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("video-upload")?.click()}
                      className="gap-2"
                      disabled={isUploadingVideo}
                    >
                      {isUploadingVideo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          {videoPreview ? "Change Video" : "Upload Video"}
                        </>
                      )}
                    </Button>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Optional: Add a video to showcase your product
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                    />
                    <Button type="button" size="sm" onClick={handleAddCategory}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingCategory(false)
                        setNewCategory("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingCategory(true)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      New
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (MAD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct} disabled={isAddingProduct}>
                {isAddingProduct ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => getProductStatus(p) === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => getProductStatus(p) === "low_stock").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => getProductStatus(p) === "out_of_stock").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Product Inventory</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{Number(product.price || 0).toFixed(2)} MAD</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{getStatusBadge(product)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
