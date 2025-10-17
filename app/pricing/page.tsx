"use client"

import { useState, useEffect } from "react"
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingPage() {
  const PLAN_6M = "prod_95gEMmTW8USDI" // 6-Month Pack - $299
  const PLAN_12M = "prod_4LZ7DcqeZbn8z" // 12-Month Pack - $499

  const [selected, setSelected] = useState<"6m" | "12m">("6m")
  const ref = useCheckoutEmbedControls()
  const activePlanId = selected === "6m" ? PLAN_6M : PLAN_12M

  useEffect(() => {
    console.log("[v0] Whop embed initialized with plan:", activePlanId)
  }, [activePlanId])

  const onComplete = async (planId: string, receiptId: string) => {
    console.log("[v0] Checkout completed:", { planId, receiptId })

    // Notify backend for reconciliation
    try {
      await fetch("/api/whop/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "client-onComplete",
          planId,
          receiptId,
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to notify backend:", error)
    }

    // Navigate to success page
    window.location.href = `/thank-you?receiptId=${receiptId}`
  }

  const features6m = [
    "Most popular, full features",
    "Unlimited products",
    "Advanced analytics",
    "Custom branding",
    "Priority support",
  ]

  const features12m = [
    "Best value, white-label + support",
    "Everything in 6-Month",
    "White-label solution",
    "Dedicated support",
    "24/7 phone support",
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the perfect subscription for your hotel management needs
          </p>
        </div>

        {/* Plan Selection */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card
            className={`cursor-pointer p-6 transition-all ${
              selected === "6m" ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelected("6m")}
          >
            <div className="mb-4">
              <h3 className="text-2xl font-bold">6-Month Pack</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold">$299</span>
                <span className="text-muted-foreground"> / 6 months</span>
              </div>
            </div>
            <ul className="space-y-2">
              {features6m.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            className={`cursor-pointer p-6 transition-all ${
              selected === "12m" ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelected("12m")}
          >
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold">12-Month Pack</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-muted-foreground"> / 12 months</span>
              </div>
            </div>
            <ul className="space-y-2">
              {features12m.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="min-h-[600px] w-full">
            <WhopCheckoutEmbed
              ref={ref}
              planId={activePlanId}
              theme="light"
              fallback={
                <div className="flex min-h-[600px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading checkout...</p>
                  </div>
                </div>
              }
              onComplete={onComplete}
              onError={(error) => {
                console.error("[v0] Whop checkout error:", error)
                const errorMsg = error?.message || "Unknown error"
                alert(
                  `Checkout Error: ${errorMsg}\n\n` +
                    `Plan ID: ${activePlanId}\n\n` +
                    `Please verify in Whop Dashboard:\n` +
                    `1. Product is published\n` +
                    `2. Pricing plan is active\n` +
                    `3. Plan ID matches exactly`,
                )
              }}
            />
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Secure payment powered by Whop. Your subscription will be processed securely.
        </p>
      </div>
    </div>
  )
}
