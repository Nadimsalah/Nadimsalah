"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Crown,
  Clock,
  ArrowUpCircle,
  Receipt,
  Loader2,
  Ticket,
  Tag,
} from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: string
  plan_name: string
  plan_description: string
  price: number
  billing_cycle: string
  duration_months: number
  max_products: number
  features: string[]
  status: string
  start_date: string
  end_date: string
  days_remaining: number
  is_active: boolean
  auto_renew: boolean
}

interface Payment {
  id: string
  amount: number
  currency: string
  payment_status: string
  payment_date: string
  transaction_id: string
}

interface Coupon {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  description: string
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscriptionData()
    fetchPaymentHistory()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const user = localStorage.getItem("user")
      if (!user) return

      const userId = JSON.parse(user).id

      const response = await fetch("/api/subscriptions", {
        headers: {
          "user-id": userId,
        },
      })

      const data = await response.json()

      if (data.success && data.subscription) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      const user = localStorage.getItem("user")
      if (!user) return

      const userId = JSON.parse(user).id

      setPayments([])
    } catch (error) {
      console.error("Failed to fetch payment history:", error)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      })
      return
    }

    setValidatingCoupon(true)

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      })

      const data = await response.json()

      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon)
        toast({
          title: "Coupon Applied!",
          description: `${data.coupon.discount_type === "percentage" ? data.coupon.discount_value + "%" : "$" + data.coupon.discount_value} discount applied`,
        })
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.error || "This coupon code is not valid or has expired",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to validate coupon:", error)
      toast({
        title: "Error",
        description: "Failed to validate coupon code",
        variant: "destructive",
      })
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your account",
    })
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    setUpdating(true)

    try {
      const user = localStorage.getItem("user")
      if (!user) return

      const userId = JSON.parse(user).id

      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
        body: JSON.stringify({
          status: "cancelled",
          autoRenew: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubscription({ ...subscription, status: "cancelled", auto_renew: false })
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully",
        })
      } else {
        throw new Error(data.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "trial":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "trial":
        return <Clock className="w-4 h-4" />
      case "cancelled":
      case "expired":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscription</h1>
            <p className="text-muted-foreground">Manage your HotelTec subscription</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground text-center mb-6">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <Button asChild>
              <Link href="/#pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage =
    subscription.days_remaining > 0
      ? Math.max(0, Math.min(100, (subscription.days_remaining / (subscription.duration_months * 30)) * 100))
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Manage your HotelTec subscription and billing</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{subscription.plan_name}</h3>
              <p className="text-muted-foreground">{subscription.plan_description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{subscription.price === 0 ? "Free" : `$${subscription.price}`}</div>
              <div className="text-sm text-muted-foreground">
                {subscription.duration_months === 0 ? "14 days" : `${subscription.duration_months} months`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1`}>
              {getStatusIcon(subscription.status)}
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </Badge>
            {subscription.max_products === -1 ? (
              <Badge variant="outline">Unlimited Products</Badge>
            ) : (
              <Badge variant="outline">{subscription.max_products} Products</Badge>
            )}
          </div>

          {subscription.is_active && subscription.days_remaining > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Time Remaining</span>
                <span>{subscription.days_remaining} days left</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Started: {new Date(subscription.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Expires: {new Date(subscription.end_date).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Section for Free Trial Users */}
      {subscription && subscription.plan_name === "Free Trial" && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Ticket className="w-5 h-5" />
              Have a Coupon Code?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-600">
              Apply a coupon code to get a discount when upgrading to a paid plan.
            </p>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                    <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {appliedCoupon.discount_type === "percentage"
                      ? `${appliedCoupon.discount_value}% OFF`
                      : `$${appliedCoupon.discount_value} OFF`}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={removeCoupon}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && validateCoupon()}
                />
                <Button onClick={validateCoupon} disabled={validatingCoupon || !couponCode.trim()}>
                  {validatingCoupon ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Plan Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscription.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Upgrade Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get more features and unlimited products with our premium plans.
            </p>
            <Button asChild className="w-full">
              <Link href={appliedCoupon ? `/checkout?coupon=${appliedCoupon.code}` : "/#pricing"}>
                {appliedCoupon ? "Upgrade with Coupon" : "View All Plans"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">View your payment history and download invoices.</p>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment history available</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    <span>${payment.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription */}
      {subscription.status === "active" && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Cancel Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Cancel your subscription. You'll continue to have access until the end of your billing period.
            </p>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
