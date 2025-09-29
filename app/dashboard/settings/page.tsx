"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  User,
  Hotel,
  Upload,
  Save,
  Loader2,
  CheckCircle,
  Store,
  Settings,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Palette,
} from "lucide-react"

interface UserData {
  id: string
  first_name: string
  last_name: string
  email: string
  hotel_name: string
  role: string
}

interface HotelData {
  id: string
  name: string
  description: string
  logo_url: string
  owner_id: string
  created_at: string
  updated_at: string
  contact_number?: string
  address?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  store_color?: string
  owner_number?: string
  currency?: string
  country?: string
  city?: string
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [hotel, setHotel] = useState<HotelData | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  const [ownerData, setOwnerData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    hotel_name: "",
  })

  const [storeData, setStoreData] = useState({
    name: "",
    description: "",
    logo_url: "",
    contact_number: "",
    address: "",
    owner_number: "",
    currency: "USD",
    country: "",
    city: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    store_color: "#8b5cf6", // Added store color field with default purple
  })

  const [storeSettings, setStoreSettings] = useState({
    enableQROrdering: true,
    enableRoomDelivery: true,
    enableNotifications: true,
  })

  const colorOptions = [
    { name: "Purple", value: "#8b5cf6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Teal", value: "#14b8a6" },
  ]

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      loadUserAndHotelData(parsedUser.id)
    }
  }, [])

  const loadUserAndHotelData = async (userId: string) => {
    try {
      // Load user data
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          "x-user-id": userId,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setOwnerData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          hotel_name: userData.hotel_name || "",
        })
      }

      // Load hotel data
      const hotelResponse = await fetch("/api/hotels/profile", {
        headers: {
          "x-user-id": userId,
        },
      })

      if (hotelResponse.ok) {
        const hotelResponseData = await hotelResponse.json()
        const hotelData = hotelResponseData.hotel || hotelResponseData
        setHotel(hotelData)
        setStoreData({
          name: hotelData.name || "",
          description: hotelData.description || "",
          logo_url: hotelData.logo_url || "",
          contact_number: hotelData.contact_number || "",
          address: hotelData.address || "",
          owner_number: hotelData.owner_number || "",
          currency: hotelData.currency || "USD",
          country: hotelData.country || "",
          city: hotelData.city || "",
          facebook_url: hotelData.facebook_url || "",
          instagram_url: hotelData.instagram_url || "",
          twitter_url: hotelData.twitter_url || "",
          linkedin_url: hotelData.linkedin_url || "",
          store_color: hotelData.store_color || "#8b5cf6", // Load store color from hotel data
        })
        setLogoPreview(hotelData.logo_url || "")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Format",
        description: "Please select a PNG, JPG, JPEG, or WebP image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))

    toast({
      title: "Logo Selected",
      description: `${file.name} ready for upload`,
    })
  }

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phone === "" || phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  const validateUrl = (url: string): boolean => {
    if (url === "") return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleOwnerInfoSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(ownerData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Owner information updated successfully",
        })

        // Update local storage
        const updatedUser = { ...user, ...ownerData }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      } else {
        throw new Error("Failed to update owner information")
      }
    } catch (error) {
      console.error("Error saving owner info:", error)
      toast({
        title: "Error",
        description: "Failed to update owner information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoreInfoSave = async () => {
    if (!user) return

    if (!validatePhoneNumber(storeData.contact_number)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    if (!validatePhoneNumber(storeData.owner_number)) {
      toast({
        title: "Invalid Owner Number",
        description: "Please enter a valid owner phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let logoUrl = storeData.logo_url

      if (logoFile) {
        const formData = new FormData()
        formData.append("logo", logoFile)

        const uploadResponse = await fetch("/api/upload/logo", {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          logoUrl = uploadData.url
        } else {
          throw new Error("Failed to upload logo")
        }
      }

      const response = await fetch("/api/hotels/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: storeData.name,
          description: storeData.description,
          logo_url: logoUrl,
          contact_number: storeData.contact_number,
          address: storeData.address,
          owner_number: storeData.owner_number,
          currency: storeData.currency,
          country: storeData.country,
          city: storeData.city,
          facebook_url: storeData.facebook_url,
          instagram_url: storeData.instagram_url,
          twitter_url: storeData.twitter_url,
          linkedin_url: storeData.linkedin_url,
          store_color: storeData.store_color, // Include store color in API request
        }),
      })

      if (response.ok) {
        setStoreData((prev) => ({ ...prev, logo_url: logoUrl }))
        setLogoFile(null)
        toast({
          title: "Success",
          description: "Store information updated successfully",
        })

        window.dispatchEvent(new CustomEvent("hotelDataUpdated"))
      } else {
        throw new Error("Failed to update store information")
      }
    } catch (error) {
      console.error("Error saving store info:", error)
      toast({
        title: "Error",
        description: "Failed to update store information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSave = async () => {
    setIsLoading(true)
    try {
      // Save preferences to localStorage or API
      localStorage.setItem("storeSettings", JSON.stringify(storeSettings))
      toast({
        title: "Success",
        description: "Store preferences saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your owner profile and store information.</p>
      </div>

      <Tabs defaultValue="owner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="owner" className="gap-2">
            <User className="w-4 h-4" />
            Owner Info
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store Info
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={ownerData.first_name}
                    onChange={(e) => setOwnerData({ ...ownerData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={ownerData.last_name}
                    onChange={(e) => setOwnerData({ ...ownerData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name (in profile)</Label>
                <Input
                  id="hotelName"
                  value={ownerData.hotel_name}
                  onChange={(e) => setOwnerData({ ...ownerData, hotel_name: e.target.value })}
                />
              </div>

              <Button onClick={handleOwnerInfoSave} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isLoading ? "Saving..." : "Save Owner Info"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={logoPreview || storeData.logo_url || "/images/hoteltec-logo.png"}
                    alt="Store Logo"
                    className="object-contain bg-white"
                  />
                  <AvatarFallback className="bg-white">
                    <Hotel className="w-10 h-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" className="gap-2 bg-transparent" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </span>
                    </Button>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: 200x200px minimum, PNG/JPG/WebP, max 5MB
                  </p>
                  {logoFile && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      New logo selected: {logoFile.name}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeData.name}
                  onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={storeData.description}
                  onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your hotel and what makes it special..."
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Store Color Theme
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Choose a color theme for your hotel store buttons and accents
                  </p>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setStoreData({ ...storeData, store_color: color.value })}
                      className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                        storeData.store_color === color.value
                          ? "border-gray-900 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {storeData.store_color === color.value && <CheckCircle className="w-6 h-6 text-white mx-auto" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="customColor" className="text-sm">
                    Custom Color:
                  </Label>
                  <Input
                    id="customColor"
                    type="color"
                    value={storeData.store_color}
                    onChange={(e) => setStoreData({ ...storeData, store_color: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{storeData.store_color}</span>
                </div>

                <div
                  className="p-4 rounded-lg text-white text-center font-medium"
                  style={{ backgroundColor: storeData.store_color }}
                >
                  Preview: This is how your store buttons will look
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Hotel Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={storeData.contact_number}
                  onChange={(e) => setStoreData({ ...storeData, contact_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-sm text-muted-foreground">
                  This number will be displayed on the Thank You page for guest inquiries
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Owner Number
                </Label>
                <Input
                  id="ownerNumber"
                  type="tel"
                  value={storeData.owner_number}
                  onChange={(e) => setStoreData({ ...storeData, owner_number: e.target.value })}
                  placeholder="+1 (555) 987-6543"
                />
                <p className="text-sm text-muted-foreground">Owner's personal contact number for business inquiries</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={storeData.currency}
                    onChange={(e) => setStoreData({ ...storeData, currency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="MAD">MAD - Moroccan Dirham</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NZD">NZD - New Zealand Dollar</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="TRY">TRY - Turkish Lira</option>
                    <option value="RUB">RUB - Russian Ruble</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="PLN">PLN - Polish Zloty</option>
                    <option value="ILS">ILS - Israeli Shekel</option>
                    <option value="DKK">DKK - Danish Krone</option>
                    <option value="CZK">CZK - Czech Koruna</option>
                    <option value="HUF">HUF - Hungarian Forint</option>
                    <option value="RON">RON - Romanian Leu</option>
                    <option value="BGN">BGN - Bulgarian Lev</option>
                    <option value="HRK">HRK - Croatian Kuna</option>
                    <option value="ISK">ISK - Icelandic Krona</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="QAR">QAR - Qatari Riyal</option>
                    <option value="KWD">KWD - Kuwaiti Dinar</option>
                    <option value="BHD">BHD - Bahraini Dinar</option>
                    <option value="OMR">OMR - Omani Rial</option>
                    <option value="JOD">JOD - Jordanian Dinar</option>
                    <option value="LBP">LBP - Lebanese Pound</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="TND">TND - Tunisian Dinar</option>
                    <option value="DZD">DZD - Algerian Dinar</option>
                    <option value="LYD">LYD - Libyan Dinar</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="MUR">MUR - Mauritian Rupee</option>
                    <option value="BWP">BWP - Botswana Pula</option>
                    <option value="NAD">NAD - Namibian Dollar</option>
                    <option value="SZL">SZL - Swazi Lilangeni</option>
                    <option value="LSL">LSL - Lesotho Loti</option>
                    <option value="MWK">MWK - Malawian Kwacha</option>
                    <option value="ZMW">ZMW - Zambian Kwacha</option>
                    <option value="ZWL">ZWL - Zimbabwean Dollar</option>
                    <option value="MZN">MZN - Mozambican Metical</option>
                    <option value="AOA">AOA - Angolan Kwanza</option>
                    <option value="XAF">XAF - Central African CFA Franc</option>
                    <option value="XOF">XOF - West African CFA Franc</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="PHP">PHP - Philippine Peso</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                    <option value="LAK">LAK - Lao Kip</option>
                    <option value="KHR">KHR - Cambodian Riel</option>
                    <option value="MMK">MMK - Myanmar Kyat</option>
                    <option value="BDT">BDT - Bangladeshi Taka</option>
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="NPR">NPR - Nepalese Rupee</option>
                    <option value="BTN">BTN - Bhutanese Ngultrum</option>
                    <option value="MVR">MVR - Maldivian Rufiyaa</option>
                    <option value="AFN">AFN - Afghan Afghani</option>
                    <option value="IRR">IRR - Iranian Rial</option>
                    <option value="IQD">IQD - Iraqi Dinar</option>
                    <option value="SYP">SYP - Syrian Pound</option>
                    <option value="YER">YER - Yemeni Rial</option>
                    <option value="GEL">GEL - Georgian Lari</option>
                    <option value="AMD">AMD - Armenian Dram</option>
                    <option value="AZN">AZN - Azerbaijani Manat</option>
                    <option value="KZT">KZT - Kazakhstani Tenge</option>
                    <option value="KGS">KGS - Kyrgyzstani Som</option>
                    <option value="TJS">TJS - Tajikistani Somoni</option>
                    <option value="TMT">TMT - Turkmenistani Manat</option>
                    <option value="UZS">UZS - Uzbekistani Som</option>
                    <option value="MNT">MNT - Mongolian Tugrik</option>
                    <option value="TWD">TWD - Taiwan Dollar</option>
                    <option value="FJD">FJD - Fijian Dollar</option>
                    <option value="PGK">PGK - Papua New Guinean Kina</option>
                    <option value="SBD">SBD - Solomon Islands Dollar</option>
                    <option value="VUV">VUV - Vanuatu Vatu</option>
                    <option value="WST">WST - Samoan Tala</option>
                    <option value="TOP">TOP - Tongan Paʻanga</option>
                    <option value="CLP">CLP - Chilean Peso</option>
                    <option value="ARS">ARS - Argentine Peso</option>
                    <option value="UYU">UYU - Uruguayan Peso</option>
                    <option value="PYG">PYG - Paraguayan Guarani</option>
                    <option value="BOB">BOB - Bolivian Boliviano</option>
                    <option value="PEN">PEN - Peruvian Sol</option>
                    <option value="COP">COP - Colombian Peso</option>
                    <option value="VES">VES - Venezuelan Bolívar</option>
                    <option value="GYD">GYD - Guyanese Dollar</option>
                    <option value="SRD">SRD - Surinamese Dollar</option>
                    <option value="TTD">TTD - Trinidad and Tobago Dollar</option>
                    <option value="JMD">JMD - Jamaican Dollar</option>
                    <option value="BBD">BBD - Barbadian Dollar</option>
                    <option value="BSD">BSD - Bahamian Dollar</option>
                    <option value="BZD">BZD - Belize Dollar</option>
                    <option value="GTQ">GTQ - Guatemalan Quetzal</option>
                    <option value="HNL">HNL - Honduran Lempira</option>
                    <option value="NIO">NIO - Nicaraguan Córdoba</option>
                    <option value="CRC">CRC - Costa Rican Colón</option>
                    <option value="PAB">PAB - Panamanian Balboa</option>
                    <option value="CUP">CUP - Cuban Peso</option>
                    <option value="DOP">DOP - Dominican Peso</option>
                    <option value="HTG">HTG - Haitian Gourde</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={storeData.country}
                    onChange={(e) => setStoreData({ ...storeData, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={storeData.city}
                    onChange={(e) => setStoreData({ ...storeData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Hotel Address</Label>
                <Textarea
                  id="address"
                  value={storeData.address}
                  onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                  rows={2}
                  placeholder="123 Hotel Street, City, State, ZIP Code"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Add your social media URLs to display on your hotel store homepage
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      type="url"
                      value={storeData.facebook_url}
                      onChange={(e) => setStoreData({ ...storeData, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/yourhotel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      type="url"
                      value={storeData.instagram_url}
                      onChange={(e) => setStoreData({ ...storeData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/yourhotel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={storeData.twitter_url}
                      onChange={(e) => setStoreData({ ...storeData, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/yourhotel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={storeData.linkedin_url}
                      onChange={(e) => setStoreData({ ...storeData, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/yourhotel"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Button onClick={handleStoreInfoSave} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isLoading ? "Saving..." : "Save Store Info"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Store Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>QR Code Ordering</Label>
                    <p className="text-sm text-muted-foreground">Allow guests to order via QR codes</p>
                  </div>
                  <Switch
                    checked={storeSettings.enableQROrdering}
                    onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, enableQROrdering: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Room Delivery</Label>
                    <p className="text-sm text-muted-foreground">Enable delivery to guest rooms</p>
                  </div>
                  <Switch
                    checked={storeSettings.enableRoomDelivery}
                    onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, enableRoomDelivery: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications for new orders</p>
                  </div>
                  <Switch
                    checked={storeSettings.enableNotifications}
                    onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, enableNotifications: checked })}
                  />
                </div>
              </div>

              <Button onClick={handlePreferencesSave} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isLoading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
