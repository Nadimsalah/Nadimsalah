"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ShoppingCart,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Calendar,
  Printer,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [hotelData, setHotelData] = useState<any>(null)

  const getUserData = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  useEffect(() => {
    fetchOrders()
    fetchHotelData()
  }, [])

  const fetchHotelData = async () => {
    try {
      const user = getUserData()
      if (!user) return

      const response = await fetch("/api/hotels/profile", {
        headers: {
          "x-user-id": user.id,
        },
      })
      const result = await response.json()

      if (result.success) {
        setHotelData(result.hotel)
      }
    } catch (error) {
      console.error("Failed to fetch hotel data:", error)
    }
  }

  const printTicket = (order: any) => {
    const ticketContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Ticket - ${order.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
              .ticket { width: 300px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
              .hotel-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .order-info { margin-bottom: 15px; }
              .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; font-size: 16px; text-align: center; margin-top: 10px; }
              .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
            }
            @media screen {
              body { background: #f5f5f5; padding: 20px; }
              .ticket { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; font-family: 'Courier New', monospace; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="hotel-name">${hotelData?.name || "Hotel"}</div>
              <div>Order Receipt</div>
            </div>
            
            <div class="order-info">
              <div><strong>Order #:</strong> ${order.id}</div>
              <div><strong>Customer:</strong> ${order.customerName}</div>
              <div><strong>Room:</strong> ${order.room}</div>
              <div><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</div>
              <div><strong>Payment:</strong> ${order.paymentMethod}</div>
              <div><strong>Status:</strong> ${order.status.toUpperCase()}</div>
            </div>
            
            <div class="items">
              <div style="font-weight: bold; margin-bottom: 10px;">Items Ordered:</div>
              ${order.items
                .map(
                  (item: any) => `
                <div class="item">
                  <div>${item.name} x${item.quantity}</div>
                  <div>${(item.price * item.quantity).toFixed(2)} MAD</div>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <div class="total">
              <div>TOTAL: ${order.total.toFixed(2)} MAD</div>
            </div>
            
            <div class="footer">
              <div>Thank you for your order!</div>
              <div style="font-size: 12px; margin-top: 5px;">
                Printed: ${new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(ticketContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view orders",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/orders", {
        headers: {
          "x-user-id": user.id,
        },
      })
      const result = await response.json()

      if (result.success) {
        // Transform API data to match component format
        const transformedOrders = result.orders.map((order: any) => ({
          id: order.order_number ? order.order_number.toString().padStart(5, "0") : order.id,
          databaseId: order.id, // Keep the actual database ID for API calls
          customerName: order.guest_name,
          room: `Room ${order.room_number}`,
          items: order.items,
          total: Number.parseFloat(order.total_amount),
          status: order.status || "pending",
          orderDate: order.order_date || order.created_at,
          deliveryTime: order.delivery_time,
          paymentMethod: order.payment_method || "Room Charge",
        }))
        setOrders(transformedOrders)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch orders",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const user = getUserData()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to update orders",
          variant: "destructive",
        })
        return
      }

      const order = orders.find((o) => o.id === orderId)
      const databaseId = order?.databaseId || orderId

      const response = await fetch(`/api/orders/${databaseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh orders list
        fetchOrders()
        toast({
          title: "Order updated",
          description: `Order status changed to ${newStatus}`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="secondary" className="gap-1">
            <Package className="w-3 h-3" />
            Preparing
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Delivered
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "preparing":
        return <Package className="w-4 h-4 text-blue-600" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.room.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">Manage and track all guest orders from your hotel webstore.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            {getStatusIcon("pending")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            {getStatusIcon("preparing")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "preparing").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            {getStatusIcon("delivered")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "delivered").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Recent Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {order.room}
                    </div>
                  </TableCell>
                  <TableCell>{order.total.toFixed(2)} MAD</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(order.orderDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
                            <DialogDescription>Complete order information and status management.</DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Customer</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Room</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.room}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Payment Method</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.paymentMethod}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Status</p>
                                  <Badge variant="outline">{selectedOrder.status}</Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium mb-2">Items Ordered</p>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                      </div>
                                      <p className="text-sm font-medium">
                                        {(item.price * item.quantity).toFixed(2)} MAD
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t mt-2">
                                  <p className="font-medium">Total</p>
                                  <p className="font-bold">{selectedOrder.total.toFixed(2)} MAD</p>
                                </div>
                              </div>

                              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                                <div className="flex gap-2">
                                  {selectedOrder.status === "pending" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}>
                                      Start Preparing
                                    </Button>
                                  )}
                                  {selectedOrder.status === "preparing" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}>
                                      Mark as Delivered
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                                  >
                                    Cancel Order
                                  </Button>
                                </div>
                              )}

                              <div className="flex gap-2 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => printTicket(selectedOrder)}
                                  className="flex items-center gap-2"
                                >
                                  <Printer className="w-4 h-4" />
                                  Print Ticket
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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
