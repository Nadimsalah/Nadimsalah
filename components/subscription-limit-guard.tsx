"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Crown, ArrowUpCircle } from "lucide-react"
import Link from "next/link"

interface SubscriptionLimitGuardProps {
  children: React.ReactNode
  requiredFeature?: string
  currentCount?: number
  maxAllowed?: number
  upgradeMessage?: string
}

export function SubscriptionLimitGuard({
  children,
  requiredFeature = "this feature",
  currentCount = 0,
  maxAllowed = 0,
  upgradeMessage,
}: SubscriptionLimitGuardProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const user = localStorage.getItem("user")
      if (!user) return

      const userId = JSON.parse(user).id

      const response = await fetch("/api/subscriptions/status", {
        headers: {
          "user-id": userId,
        },
      })

      const data = await response.json()

      if (data.success) {
        setSubscription(data)
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg" />
  }

  // If no subscription or subscription is not active, show upgrade prompt
  if (!subscription || !subscription.isActive) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Crown className="w-5 h-5" />
            Subscription Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              <p>You need an active subscription to access {requiredFeature}.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/subscription">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                View Plans
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if user has hit their limit
  if (maxAllowed > 0 && currentCount >= maxAllowed) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Limit Reached
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-orange-700">
              {upgradeMessage ||
                `You've reached your limit of ${maxAllowed} items on the ${subscription.planName} plan.`}
            </p>
            <Button asChild>
              <Link href="/dashboard/subscription">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // User has access, render children
  return <>{children}</>
}
