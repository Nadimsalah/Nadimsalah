"use client"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const receiptId = searchParams.get("receiptId")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="mb-4 text-3xl font-bold">Payment Successful!</h1>

        <p className="mb-6 text-muted-foreground">
          Thank you for subscribing to HotelTec. Your subscription has been activated.
        </p>

        {receiptId && (
          <div className="mb-6 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Receipt ID</p>
            <p className="font-mono text-sm">{receiptId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
