"use client"

import type React from "react"
import { useToast } from "@/hooks/use-toast" // Added import for useToast

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Hotel, Upload, X, MapPin, Phone, Building2, Check, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showHotelDetailsModal, setShowHotelDetailsModal] = useState(false)
  const [isHotelDetailsLoading, setIsHotelDetailsLoading] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    hotelName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [hotelDetails, setHotelDetails] = useState({
    name: "",
    address: "",
    phone: "",
    logoFile: null as File | null,
  })

  const [logoPreview, setLogoPreview] = useState<string>("")

  const { toast } = useToast() // Ensure useToast is correctly imported
  const router = useRouter()

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { level: "weak", color: "text-red-500", text: "Weak" }
    if (strength <= 3) return { level: "medium", color: "text-yellow-500", text: "Medium" }
    return { level: "strong", color: "text-green-500", text: "Strong" }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleHotelDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setHotelDetails((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setHotelDetails((prev) => ({ ...prev, logoFile: file }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setHotelDetails((prev) => ({ ...prev, logoFile: null }))
    setLogoPreview("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          hotelName: formData.hotelName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUserId(data.user.id)
        setHotelDetails((prev) => ({ ...prev, name: formData.hotelName }))
        setShowHotelDetailsModal(true)
        toast({
          title: "Account created successfully!",
          description: "Please complete your hotel profile to get started.",
        })
      } else {
        toast({
          title: "Error creating account",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error creating account",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleHotelDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsHotelDetailsLoading(true)

    try {
      let logoUrl = ""

      if (hotelDetails.logoFile) {
        const logoFormData = new FormData()
        logoFormData.append("logo", hotelDetails.logoFile)

        const logoResponse = await fetch("/api/upload/logo", {
          method: "POST",
          headers: {
            "x-user-id": userId,
          },
          body: logoFormData,
        })

        if (logoResponse.ok) {
          const logoData = await logoResponse.json()
          logoUrl = logoData.url
        } else {
          console.log("[v0] Logo upload failed:", await logoResponse.text())
        }
      }

      const response = await fetch("/api/hotels/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name: hotelDetails.name,
          address: hotelDetails.address,
          phone: hotelDetails.phone,
          logo_url: logoUrl,
        }),
      })

      if (response.ok) {
        toast({
          title: "Hotel profile completed!",
          description: "Welcome to HotelTec. Redirecting to your dashboard...",
        })

        localStorage.setItem(
          "user",
          JSON.stringify({
            id: userId,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            hotelName: hotelDetails.name,
          }),
        )

        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        throw new Error("Failed to save hotel details")
      }
    } catch (error) {
      toast({
        title: "Error saving hotel details",
        description: "Please try again or skip for now.",
        variant: "destructive",
      })
    } finally {
      setIsHotelDetailsLoading(false)
    }
  }

  const skipHotelDetails = () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: userId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        hotelName: formData.hotelName,
      }),
    )

    toast({
      title: "Account created!",
      description: "You can complete your hotel profile later in settings.",
    })

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 bg-white rounded-lg px-2 py-1">
              <Image
                src="/images/hoteltec-logo.png"
                alt="HotelTec"
                width={120}
                height={32}
                className="h-6 w-auto object-contain"
              />
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Hotel className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Join HotelTec and start building your hotel webstore today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input
                  id="hotelName"
                  placeholder="Grand Hotel & Resort"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@grandhotel.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>Password strength:</span>
                    <span className={getPasswordStrength(formData.password).color}>
                      {getPasswordStrength(formData.password).text}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
              <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2024 HotelTec. All rights reserved.</p>
        </div>
      </footer>

      <Dialog open={showHotelDetailsModal} onOpenChange={setShowHotelDetailsModal}>
        <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300">
          <DialogHeader className="text-center pb-4 sticky top-0 bg-background z-10">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold">Complete Your Hotel Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add your hotel details to create a personalized experience for your guests
            </DialogDescription>
          </DialogHeader>

          <div className="px-1">
            <form onSubmit={handleHotelDetailsSubmit} className="space-y-6 pb-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Hotel Name
                </Label>
                <Input
                  id="name"
                  placeholder="Grand Hotel & Resort"
                  value={hotelDetails.name}
                  onChange={handleHotelDetailsChange}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Hotel Logo
                </Label>
                {logoPreview ? (
                  <div className="relative w-20 h-20 mx-auto">
                    <Image
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      fill
                      className="object-cover rounded-lg border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload your hotel logo</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label
                      htmlFor="logo-upload"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
                    >
                      Choose File
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Hotel Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, Country"
                  value={hotelDetails.address}
                  onChange={handleHotelDetailsChange}
                  rows={2}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={hotelDetails.phone}
                  onChange={handleHotelDetailsChange}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="sticky bottom-0 bg-background pt-4 border-t">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={skipHotelDetails}
                    className="flex-1 bg-transparent"
                    disabled={isHotelDetailsLoading}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-200"
                    disabled={isHotelDetailsLoading}
                  >
                    {isHotelDetailsLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Complete Setup
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
