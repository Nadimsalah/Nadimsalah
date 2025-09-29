"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  TestTube,
} from "lucide-react"

interface PaymentGateway {
  id: string
  hotel_id: string
  hotel_name: string
  gateway_type: string
  is_enabled: boolean
  webhook_url: string
  created_at: string
}

interface PaymentStats {
  gateway_type: string
  total_transactions: number
  total_revenue: number
  successful_transactions: number
  failed_transactions: number
}

interface Transaction {
  id: string
  transaction_id: string
  amount: number
  currency: string
  status: string
  gateway_type: string
  created_at: string
  hotel_name: string
  guest_name: string
  room_number: string
}

interface Hotel {
  id: string
  name: string
}

export default function PaymentsPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [stats, setStats] = useState<PaymentStats[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState("")
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)

  const [gatewayConfig, setGatewayConfig] = useState({
    gateway_type: "stripe",
    is_enabled: false,
    is_test_mode: true,
    api_key: "",
    secret_key: "",
    webhook_url: "",
    webhook_secret: "",
    currency: "USD",
    description: "",
  })

  useEffect(() => {
    fetchPaymentData()
    fetchHotels()
  }, [])

  const fetchPaymentData = async () => {
    try {
      const response = await fetch("/api/super-admin/payment-gateways")
      const data = await response.json()
      setGateways(data.gateways || [])
      setStats(data.stats || [])
      setTransactions(data.recentTransactions || [])
    } catch (error) {
      console.error("Failed to fetch payment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotels = async () => {
    try {
      const response = await fetch("/api/super-admin/hotels")
      const data = await response.json()
      setHotels(data.hotels || [])
    } catch (error) {
      console.error("Failed to fetch hotels:", error)
    }
  }

  const testGatewayConnection = async () => {
    if (!gatewayConfig.api_key || !gatewayConfig.secret_key) {
      setConnectionStatus({ success: false, message: "Please enter API key and secret key" })
      return
    }

    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const response = await fetch("/api/super-admin/payment-gateways/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway_type: gatewayConfig.gateway_type,
          api_key: gatewayConfig.api_key,
          secret_key: gatewayConfig.secret_key,
          is_test_mode: gatewayConfig.is_test_mode,
        }),
      })

      const result = await response.json()
      setConnectionStatus({
        success: response.ok,
        message: result.message || (response.ok ? "Connection successful!" : "Connection failed"),
      })
    } catch (error) {
      setConnectionStatus({ success: false, message: "Failed to test connection" })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSaveGateway = async () => {
    if (!selectedHotel) {
      setConnectionStatus({ success: false, message: "Please select a hotel" })
      return
    }

    try {
      const response = await fetch("/api/super-admin/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: selectedHotel,
          ...gatewayConfig,
        }),
      })

      if (response.ok) {
        fetchPaymentData()
        setGatewayConfig({
          gateway_type: "stripe",
          is_enabled: false,
          is_test_mode: true,
          api_key: "",
          secret_key: "",
          webhook_url: "",
          webhook_secret: "",
          currency: "USD",
          description: "",
        })
        setSelectedHotel("")
        setConnectionStatus({ success: true, message: "Gateway configuration saved successfully!" })
      } else {
        const error = await response.json()
        setConnectionStatus({ success: false, message: error.message || "Failed to save configuration" })
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: "Failed to save gateway configuration" })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Payment Gateways</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stripeStats = stats.find((s) => s.gateway_type === "stripe")
  const paypalStats = stats.find((s) => s.gateway_type === "paypal")
  const totalRevenue = stats.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0)
  const totalTransactions = stats.reduce((sum, s) => sum + Number(s.total_transactions || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Gateways</h1>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Configure Gateway
        </Button>
      </div>

      {/* Payment Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All payment gateways</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${(stripeStats?.total_revenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stripeStats?.total_transactions || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayPal Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${(paypalStats?.total_revenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{paypalStats?.total_transactions || 0} transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gateways" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
        </TabsList>

        <TabsContent value="gateways" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Payment Gateways</CardTitle>
              <CardDescription>Manage payment gateway configurations for all hotels</CardDescription>
            </CardHeader>
            <CardContent>
              {gateways.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No payment gateways configured</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Get started by configuring a payment gateway.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gateways.map((gateway) => (
                    <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{gateway.hotel_name}</h4>
                          <Badge variant="outline">{gateway.gateway_type}</Badge>
                          {gateway.is_enabled ? <Badge>Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Webhook: {gateway.webhook_url || "Not configured"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment transactions across all hotels</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No transactions yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Transactions will appear here once payments are processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{transaction.hotel_name}</h4>
                          <Badge variant="outline">{transaction.gateway_type}</Badge>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.guest_name} - Room {transaction.room_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-black">${transaction.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{transaction.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Payment Gateway</CardTitle>
              <CardDescription>Set up Stripe or PayPal for a hotel with comprehensive settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Settings</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hotel">Select Hotel</Label>
                      <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gateway">Gateway Type</Label>
                      <Select
                        value={gatewayConfig.gateway_type}
                        onValueChange={(value) => setGatewayConfig((prev) => ({ ...prev, gateway_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={gatewayConfig.is_enabled}
                        onCheckedChange={(checked) => setGatewayConfig((prev) => ({ ...prev, is_enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enable Gateway</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="test_mode"
                        checked={gatewayConfig.is_test_mode}
                        onCheckedChange={(checked) => setGatewayConfig((prev) => ({ ...prev, is_test_mode: checked }))}
                      />
                      <Label htmlFor="test_mode">Test Mode</Label>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">API Configuration</h3>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="api_key">
                        {gatewayConfig.gateway_type === "stripe" ? "Publishable Key" : "Client ID"}
                      </Label>
                      <Input
                        id="api_key"
                        type="password"
                        placeholder={gatewayConfig.gateway_type === "stripe" ? "pk_test_..." : "Client ID"}
                        value={gatewayConfig.api_key}
                        onChange={(e) => setGatewayConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secret_key">
                        {gatewayConfig.gateway_type === "stripe" ? "Secret Key" : "Client Secret"}
                      </Label>
                      <Input
                        id="secret_key"
                        type="password"
                        placeholder={gatewayConfig.gateway_type === "stripe" ? "sk_test_..." : "Client Secret"}
                        value={gatewayConfig.secret_key}
                        onChange={(e) => setGatewayConfig((prev) => ({ ...prev, secret_key: e.target.value }))}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testGatewayConnection}
                        disabled={testingConnection || !gatewayConfig.api_key || !gatewayConfig.secret_key}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <TestTube className="h-4 w-4" />
                        {testingConnection ? "Testing..." : "Test Connection"}
                      </Button>

                      {connectionStatus && (
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                            connectionStatus.success
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {connectionStatus.success ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {connectionStatus.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Webhook Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Webhook Configuration</h3>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook_url">Webhook URL</Label>
                      <Input
                        id="webhook_url"
                        placeholder="https://your-domain.com/api/webhooks/payments"
                        value={gatewayConfig.webhook_url}
                        onChange={(e) => setGatewayConfig((prev) => ({ ...prev, webhook_url: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook_secret">Webhook Secret</Label>
                      <Input
                        id="webhook_secret"
                        type="password"
                        placeholder="Webhook signing secret"
                        value={gatewayConfig.webhook_secret}
                        onChange={(e) => setGatewayConfig((prev) => ({ ...prev, webhook_secret: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Settings</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select
                        value={gatewayConfig.currency}
                        onValueChange={(value) => setGatewayConfig((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this gateway configuration..."
                      value={gatewayConfig.description}
                      onChange={(e) => setGatewayConfig((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveGateway} className="w-full" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Save Gateway Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to configure your payment gateway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gatewayConfig.gateway_type === "stripe" ? (
                <div className="space-y-3">
                  <h4 className="font-semibold">Stripe Setup:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Log in to your Stripe Dashboard</li>
                    <li>Go to Developers → API keys</li>
                    <li>Copy your Publishable key and Secret key</li>
                    <li>For webhooks, go to Developers → Webhooks</li>
                    <li>Add endpoint: https://your-domain.com/api/webhooks/stripe</li>
                    <li>Select events: payment_intent.succeeded, payment_intent.payment_failed</li>
                    <li>Copy the webhook signing secret</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold">PayPal Setup:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Log in to PayPal Developer Dashboard</li>
                    <li>Create a new app or select existing one</li>
                    <li>Copy your Client ID and Client Secret</li>
                    <li>Configure webhook notifications</li>
                    <li>Add webhook URL: https://your-domain.com/api/webhooks/paypal</li>
                    <li>Subscribe to payment events</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
