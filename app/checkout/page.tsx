"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  CreditCard,
  ArrowLeft,
  Loader2,
  Crown,
  AlertTriangle,
  Tag,
  X,
  Percent,
  DollarSign,
  User,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: string
  duration_months: number
  max_products: number
  features: string[]
}

interface AppliedCoupon {
  id: string
  code: string
  name: string
  discount_type: "percentage" | "fixed_amount"
  discount_value: number
  discount_amount: number
  final_amount: number
}

const WHOP_PLAN_IDS = {
  "6-month-pack": "plan_xxx_6m", // Replace with actual Whop Plan ID from dashboard
  "12-month-pack": "plan_xxx_12m", // Replace with actual Whop Plan ID from dashboard
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const whopCheckoutRef = useRef<HTMLDivElement>(null)

  const [plan, setPlan] = useState<Plan | null>(null)
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [showWhopCheckout, setShowWhopCheckout] = useState(false)
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    hotelName: "",
    password: "",
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const planParam = searchParams.get("plan")
  const isUpgradeFlow = planParam === "upgrade"
  const upgradeReason = searchParams.get("reason")
  const isHotelStoreFlow = searchParams.get("source") === "qr" || searchParams.get("flow") === "hotel-store"

  const safeJsonParse = async (response: Response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.error("[v0] Non-JSON response received:", responseText)
      throw new Error("Server returned non-JSON response")
    }

    try {
      return await response.json()
    } catch (error) {
      console.error("[v0] JSON parsing error:", error)
      throw new Error("Invalid JSON response from server")
    }
  }

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/subscriptions/plans")
        const data = await safeJsonParse(response)
        setAllPlans(data.plans || [])
      } catch (error) {
        console.error("Error fetching plans:", error)
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        })
      }
    }
    fetchPlans()
  }, [])

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await fetch("/api/subscriptions/plans")
        const data = await safeJsonParse(response)

        const plansWithNumericPrices = data.plans.map((p: any) => ({
          ...p,
          price: Number.parseFloat(p.price) || 0,
        }))

        setAllPlans(plansWithNumericPrices)

        if (isUpgradeFlow) {
          const paidPlans = plansWithNumericPrices.filter((p: Plan) => p.price > 0)
          setAvailablePlans(paidPlans)
          setPlan(paidPlans[0]) // Default to first paid plan
        } else {
          const selectedPlan = plansWithNumericPrices.find(
            (p: Plan) => p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === planParam,
          )
          setPlan(selectedPlan || plansWithNumericPrices[0])
          setAvailablePlans([selectedPlan || plansWithNumericPrices[0]])
        }
      } catch (error) {
        console.error("Failed to fetch plan details:", error)
        toast({
          title: "Error",
          description: "Failed to load plan details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const checkUserSession = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setIsLoggedIn(true)
          setCurrentUser(userData)
          setUserInfo({
            firstName: userData.firstName || userData.first_name || "",
            lastName: userData.lastName || userData.last_name || "",
            email: userData.email || "",
            hotelName: userData.hotelName || userData.hotel_name || "",
            password: "",
          })
          return
        }

        // Fallback to API check
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })
        if (response.ok) {
          const userData = await safeJsonParse(response)
          if (userData.success && userData.user) {
            setIsLoggedIn(true)
            setCurrentUser(userData.user)
            setUserInfo({
              firstName: userData.user.first_name || "",
              lastName: userData.user.last_name || "",
              email: userData.user.email || "",
              hotelName: userData.user.hotel_name || "",
              password: "",
            })
          }
        }
      } catch (error) {
        console.log("User not logged in or session check failed")
      }
    }

    fetchPlanDetails()
    checkUserSession()
  }, [planParam])

  useEffect(() => {
    if (showWhopCheckout && whopCheckoutRef.current && plan) {
      console.log("[v0] Initializing Whop checkout...")

      const planSlug = plan.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
      const whopPlanId = WHOP_PLAN_IDS[planSlug as keyof typeof WHOP_PLAN_IDS]

      console.log("[v0] Plan slug:", planSlug)
      console.log("[v0] Whop Plan ID:", whopPlanId)

      if (!whopPlanId || whopPlanId.includes("xxx")) {
        console.error("[v0] Invalid Whop Plan ID:", whopPlanId)
        toast({
          title: "Configuration Error",
          description:
            "Payment system not configured. Please update WHOP_PLAN_IDS with your actual plan IDs from Whop dashboard.",
          variant: "destructive",
        })
        setShowWhopCheckout(false)
        setProcessing(false)
        return
      }

      const script = document.createElement("script")
      script.src = "https://assets.whop.com/sdk/v3/whop-sdk.js"
      script.async = true

      script.onload = () => {
        console.log("[v0] Whop SDK loaded successfully")

        // Check if Whop is available
        if (typeof window.Whop === "undefined") {
          console.error("[v0] Whop SDK not available after script load")
          toast({
            title: "Payment System Error",
            description: "Failed to load payment system. Please refresh and try again.",
            variant: "destructive",
          })
          setShowWhopCheckout(false)
          setProcessing(false)
          return
        }

        try {
          const finalAmount = appliedCoupon ? appliedCoupon.final_amount : plan.price

          console.log("[v0] Creating Whop checkout with config:", {
            planId: whopPlanId,
            email: userInfo.email,
            finalAmount,
          })

          // Initialize Whop checkout in the container
          window.Whop.createCheckout({
            element: whopCheckoutRef.current!,
            planId: whopPlanId,
            email: userInfo.email || undefined,
            metadata: {
              hotelName: userInfo.hotelName,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              couponCode: appliedCoupon?.code || "",
              discountAmount: appliedCoupon?.discount_amount || 0,
              finalAmount: finalAmount,
            },
            onPaymentSuccess: async (data: any) => {
              console.log("[v0] Whop payment success:", data)
              await handleWhopCheckoutSuccess(data)
            },
            onError: (error: any) => {
              console.error("[v0] Whop checkout error:", error)
              toast({
                title: "Payment Failed",
                description: error?.message || "There was an error processing your payment. Please try again.",
                variant: "destructive",
              })
              setShowWhopCheckout(false)
              setProcessing(false)
            },
          })

          console.log("[v0] Whop checkout initialized successfully")
        } catch (error) {
          console.error("[v0] Error initializing Whop checkout:", error)
          toast({
            title: "Checkout Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          })
          setShowWhopCheckout(false)
          setProcessing(false)
        }
      }

      script.onerror = () => {
        console.error("[v0] Failed to load Whop SDK script")
        toast({
          title: "Connection Error",
          description: "Failed to connect to payment system. Please check your internet connection and try again.",
          variant: "destructive",
        })
        setShowWhopCheckout(false)
        setProcessing(false)
      }

      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [showWhopCheckout, plan, userInfo, appliedCoupon])

  const handleWhopCheckoutSuccess = async (whopData: any) => {
    try {
      setProcessing(true)

      // Call backend to create subscription with Whop payment data
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.id && { "user-id": currentUser.id }),
        },
        body: JSON.stringify({
          type: "subscription",
          planId: plan?.id,
          userInfo,
          couponId: appliedCoupon?.code,
          paymentMethod: "whop",
          whopPaymentData: whopData,
        }),
      })

      const checkoutData = await safeJsonParse(checkoutResponse)

      if (!checkoutData.success) {
        throw new Error(checkoutData.error || "Checkout failed")
      }

      if (checkoutData.user) {
        localStorage.setItem("user", JSON.stringify(checkoutData.user))
        localStorage.setItem("isNewAccount", "true")
      }

      toast({
        title: "Payment Successful!",
        description: "Your account has been created. Redirecting to dashboard...",
      })

      setTimeout(() => {
        router.push("/dashboard?welcome=true&setup=true")
      }, 2000)
    } catch (error) {
      console.error("[v0] Whop checkout success handler error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete checkout",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setShowWhopCheckout(false)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim() || !plan) return

    console.log("[v0] Validating coupon:", couponCode.trim(), "for plan:", plan.id, "amount:", plan.price)
    setCouponLoading(true)
    try {
      const requestBody = {
        code: couponCode.trim(),
        planId: plan.id,
        orderAmount: plan.price,
      }
      console.log("[v0] Coupon validation request:", requestBody)

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Coupon validation response status:", response.status)

      const data = await safeJsonParse(response)

      if (data.valid) {
        const appliedCouponData = {
          id: data.coupon.id,
          code: data.coupon.code,
          name: data.coupon.code,
          discount_type: data.coupon.discount_type,
          discount_value: Number.parseFloat(data.coupon.discount_value),
          discount_amount: data.discountAmount,
          final_amount: data.finalAmount,
        }
        setAppliedCoupon(appliedCouponData)
        console.log("[v0] Coupon applied successfully:", appliedCouponData)

        const isFree = data.finalAmount === 0
        toast({
          title: isFree ? "🎉 Free Account Activated!" : "Coupon Applied!",
          description: isFree
            ? `${data.coupon.code} - Your account will be completely FREE!`
            : `${data.coupon.code} - Save $${data.discountAmount.toFixed(2)}`,
        })
      } else {
        console.log("[v0] Coupon validation failed:", data.error)
        toast({
          title: "Invalid Coupon",
          description: data.error || "This coupon code is not valid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Coupon validation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to validate coupon",
        variant: "destructive",
      })
    } finally {
      setCouponLoading(false)
    }
  }

  // Added function to remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlanSelect = (selectedPlan: Plan) => {
    setPlan(selectedPlan)
    // Reset coupon when plan changes
    if (appliedCoupon) {
      setAppliedCoupon(null)
      setCouponCode("")
      toast({
        title: "Coupon Removed",
        description: "Coupon removed due to plan change. Please reapply if needed.",
      })
    }
  }

  const handleCheckout = async () => {
    if (!plan) return

    // Validate required fields
    if (!isLoggedIn && !isHotelStoreFlow) {
      if (!userInfo.email || !userInfo.firstName || !userInfo.lastName || !userInfo.hotelName || !userInfo.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    }

    setProcessing(true)

    try {
      const finalPrice = appliedCoupon ? appliedCoupon.final_amount : plan.price

      if (finalPrice > 0 && !isHotelStoreFlow) {
        const planSlug = plan.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
        const whopPlanId = WHOP_PLAN_IDS[planSlug as keyof typeof WHOP_PLAN_IDS]

        if (!whopPlanId) {
          toast({
            title: "Configuration Error",
            description: "This plan is not available for purchase yet. Please contact support.",
            variant: "destructive",
          })
          setProcessing(false)
          return
        }

        // Show Whop checkout
        setShowWhopCheckout(true)
        return
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.id && { "user-id": currentUser.id }),
        },
        body: JSON.stringify({
          type: isHotelStoreFlow ? "hotel_order" : "subscription",
          planId: plan.id,
          userInfo,
          hotelId: searchParams.get("hotelId") || searchParams.get("hotel"),
          items: isHotelStoreFlow
            ? [
                {
                  name: plan.name,
                  description: plan.description,
                  price: finalPrice,
                  quantity: 1,
                },
              ]
            : undefined,
          couponId: appliedCoupon?.code,
          paymentMethod: "free",
        }),
      })

      const checkoutData = await safeJsonParse(checkoutResponse)

      if (!checkoutData.success) {
        throw new Error(checkoutData.error || "Checkout failed")
      }

      // Handle successful checkout based on type
      if (checkoutData.checkout.type === "hotel_order") {
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${checkoutData.checkout.orderNumber} has been submitted.`,
        })

        setTimeout(() => {
          const returnUrl = searchParams.get("returnUrl")
          if (returnUrl) {
            window.location.href = returnUrl
          } else {
            router.push("/")
          }
        }, 2000)
      } else {
        // Handle subscription checkout success
        if (checkoutData.checkout.user) {
          // Store user session data for new accounts
          localStorage.setItem("user", JSON.stringify(checkoutData.checkout.user))
          localStorage.setItem("isNewAccount", "true") // Flag for onboarding
        }

        // Free subscription
        toast({
          title: "Welcome to HotelTec!",
          description: "Your free account has been created. Redirecting to dashboard...",
        })

        setTimeout(() => {
          router.push("/dashboard?welcome=true&setup=true")
        }, 1500)
      }
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Something went wrong during checkout",
        variant: "destructive",
      })
    } finally {
      if (!showWhopCheckout) {
        setProcessing(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
          <Button asChild>
            <Link href="/#pricing">Back to Pricing</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Calculate pricing with coupon discount
  const originalPrice = plan.price
  const discountAmount = appliedCoupon?.discount_amount || 0
  const finalPrice = appliedCoupon ? appliedCoupon.final_amount : originalPrice

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {showWhopCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Complete Your Payment</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowWhopCheckout(false)
                    setProcessing(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div ref={whopCheckoutRef} id="whop-checkout-container" className="min-h-[500px] w-full">
                {/* Loading state shown while Whop initializes */}
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading secure checkout...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={isUpgradeFlow ? "/dashboard/products" : "/#pricing"}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isUpgradeFlow ? "Back to Products" : "Back to Pricing"}
            </Link>
          </Button>
          {isUpgradeFlow ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-3xl font-bold">{isLoggedIn ? "Upgrade Your Plan" : "Upgrade Required"}</h1>
              </div>
              {upgradeReason === "product-limit" && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <p className="text-orange-800">
                    You've reached your 5-product limit. Upgrade to add unlimited products to your hotel store.
                  </p>
                </div>
              )}
              <p className="text-muted-foreground">
                {isLoggedIn
                  ? "Choose a plan to unlock unlimited products and premium features for your existing account"
                  : "Choose a plan to unlock unlimited products and premium features"}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold">{isLoggedIn ? "Upgrade Your Account" : "Complete Your Order"}</h1>
              <p className="text-muted-foreground">
                {isLoggedIn
                  ? "Enhance your HotelTec experience with premium features"
                  : "Start your HotelTec journey today"}
              </p>
            </div>
          )}
        </div>

        {isUpgradeFlow && availablePlans.length > 1 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {availablePlans.map((availablePlan) => (
                <Card
                  key={availablePlan.id}
                  className={`cursor-pointer transition-all ${
                    plan.id === availablePlan.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                  }`}
                  onClick={() => handlePlanSelect(availablePlan)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{availablePlan.name}</CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${availablePlan.price}</div>
                        <div className="text-sm text-muted-foreground">{availablePlan.duration_months} months</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{availablePlan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {availablePlan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          {feature}
                        </div>
                      ))}
                      {availablePlan.features.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{availablePlan.features.length - 3} more features
                        </div>
                      )}
                    </div>
                    {plan.id === availablePlan.id && (
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                        <Check className="w-4 h-4" />
                        Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{originalPrice === 0 ? "Free" : `$${originalPrice}`}</div>
                    <div className="text-sm text-muted-foreground">
                      {plan.duration_months === 0 ? "14 days" : `${plan.duration_months} months`}
                    </div>
                  </div>
                </div>

                {/* Added coupon application section */}
                {originalPrice > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Have a Coupon?
                      </h4>
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === "Enter" && validateCoupon()}
                          />
                          <Button
                            variant="outline"
                            onClick={validateCoupon}
                            disabled={!couponCode.trim() || couponLoading}
                          >
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {appliedCoupon.code}
                              </Badge>
                              <span className="text-sm font-medium text-green-800">{appliedCoupon.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-700">
                            {appliedCoupon.discount_type === "percentage" ? (
                              <Percent className="w-3 h-3" />
                            ) : (
                              <DollarSign className="w-3 h-3" />
                            )}
                            <span>
                              {appliedCoupon.discount_type === "percentage"
                                ? `${appliedCoupon.discount_value}% off`
                                : `$${appliedCoupon.discount_value} off`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Included Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-secondary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Updated pricing breakdown to show discount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{originalPrice === 0 ? "Free" : `$${originalPrice.toFixed(2)}`}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{finalPrice === 0 ? "Free" : `$${finalPrice.toFixed(2)}`}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    <User className="w-5 h-5" />
                    Account Upgrade
                  </>
                ) : (
                  "Account Information"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoggedIn ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">Upgrading account for:</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Name:</strong> {currentUser?.firstName || currentUser?.first_name}{" "}
                        {currentUser?.lastName || currentUser?.last_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {currentUser?.email}
                      </div>
                      {(currentUser?.hotelName || currentUser?.hotel_name) && (
                        <div>
                          <strong>Hotel:</strong> {currentUser.hotelName || currentUser.hotel_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {finalPrice > 0 && !isHotelStoreFlow && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Payment Method
                        </h4>
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">
                            Secure payment processing powered by Whop. You'll complete your payment in a secure checkout
                            window.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {finalPrice === 0 ? "Upgrading..." : "Opening Checkout..."}
                      </>
                    ) : finalPrice === 0 ? (
                      "Upgrade to Free Plan"
                    ) : isUpgradeFlow ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Account - ${finalPrice.toFixed(2)}
                      </>
                    ) : (
                      `Upgrade Now - $${finalPrice.toFixed(2)}`
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your upgrade will be applied to your existing account. By continuing, you agree to our Terms of
                    Service.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{isHotelStoreFlow ? "Guest First Name *" : "First Name *"}</Label>
                      <Input
                        id="firstName"
                        value={userInfo.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{isHotelStoreFlow ? "Guest Last Name *" : "Last Name *"}</Label>
                      <Input
                        id="lastName"
                        value={userInfo.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">{isHotelStoreFlow ? "Contact Email *" : "Email Address *"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder={isHotelStoreFlow ? "john@email.com" : "john@hotel.com"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hotelName">{isHotelStoreFlow ? "Room Number" : "Hotel Name *"}</Label>
                    <Input
                      id="hotelName"
                      value={userInfo.hotelName}
                      onChange={(e) => handleInputChange("hotelName", e.target.value)}
                      placeholder={isHotelStoreFlow ? "101" : "Grand Hotel"}
                    />
                  </div>

                  {!isLoggedIn && !isHotelStoreFlow && (
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userInfo.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Create a secure password"
                      />
                    </div>
                  )}

                  {finalPrice > 0 && !isHotelStoreFlow && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Payment Method
                        </h4>
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">
                            Secure payment processing powered by Whop. You'll complete your payment in a secure checkout
                            window.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {finalPrice === 0 ? "Processing..." : "Opening Checkout..."}
                      </>
                    ) : finalPrice === 0 ? (
                      "Start Free Trial"
                    ) : isUpgradeFlow ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now - ${finalPrice.toFixed(2)}
                      </>
                    ) : isHotelStoreFlow ? (
                      "Complete Order"
                    ) : (
                      `Complete Purchase - $${finalPrice.toFixed(2)}`
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    Whop?: {
      createCheckout: (config: {
        element: HTMLElement
        planId: string
        email?: string
        metadata?: Record<string, any>
        onPaymentSuccess: (data: any) => void
        onError: (error: any) => void
      }) => void
    }
  }
}
