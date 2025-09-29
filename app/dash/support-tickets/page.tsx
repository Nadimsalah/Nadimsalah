"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { MessageCircle, Clock, CheckCircle, XCircle, AlertCircle, Search, User, Building2 } from "lucide-react"

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  email: string
  hotel_name: string
  comment_count: number
}

interface TicketComment {
  id: string
  comment: string
  is_admin_response: boolean
  created_at: string
  first_name: string
  last_name: string
  role: string
}

interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

export default function SuperAdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketDetails, setTicketDetails] = useState<{
    ticket: SupportTicket
    comments: TicketComment[]
    attachments: any[]
  } | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [newStatus, setNewStatus] = useState("open")

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  })

  useEffect(() => {
    fetchTickets()
  }, [filters])

  const fetchTickets = async () => {
    try {
      console.log("[v0] Fetching tickets with filters:", filters)

      const params = new URLSearchParams()
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.priority !== "all") params.append("priority", filters.priority)
      if (filters.search) params.append("search", filters.search)

      console.log("[v0] API URL:", `/api/super-admin/support-tickets?${params}`)
      const response = await fetch(`/api/super-admin/support-tickets?${params}`)

      console.log("[v0] API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] API response data:", data)
        setTickets(data.tickets)
        setStats(data.stats)
      } else {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        toast({
          title: "Error",
          description: `Failed to load support tickets: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching tickets:", error)
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/super-admin/support-tickets/${ticketId}`)

      if (response.ok) {
        const data = await response.json()
        setTicketDetails(data)
        setNewStatus(data.ticket.status)
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error)
    }
  }

  const handleUpdateTicket = async (ticketId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/super-admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminComment.trim() || undefined,
          adminUserId: user.id,
        }),
      })

      if (response.ok) {
        setAdminComment("")
        fetchTicketDetails(ticketId)
        fetchTickets()
        toast({
          title: "Success",
          description: "Ticket updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />
      case "in_progress":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "closed":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">Manage and respond to user support requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No support tickets found</h3>
              <p className="text-muted-foreground text-center">No tickets match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {ticket.first_name} {ticket.last_name}
                      </span>
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {ticket.hotel_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status.replace("_", " ")}</span>
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">{ticket.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {ticket.comment_count} comments
                    </span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          fetchTicketDetails(ticket.id)
                        }}
                      >
                        Manage Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(selectedTicket?.priority || "")}>
                            {selectedTicket?.priority}
                          </Badge>
                          <Badge className={getStatusColor(selectedTicket?.status || "")}>
                            {getStatusIcon(selectedTicket?.status || "")}
                            <span className="ml-1 capitalize">{selectedTicket?.status.replace("_", " ")}</span>
                          </Badge>
                        </div>
                      </DialogHeader>

                      {ticketDetails && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">User Information</h4>
                            <div className="bg-muted p-3 rounded-lg">
                              <p>
                                <strong>Name:</strong> {ticketDetails.ticket.first_name}{" "}
                                {ticketDetails.ticket.last_name}
                              </p>
                              <p>
                                <strong>Email:</strong> {ticketDetails.ticket.email}
                              </p>
                              <p>
                                <strong>Hotel:</strong> {ticketDetails.ticket.hotel_name}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                              {ticketDetails.ticket.description}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Comments & Responses</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {ticketDetails.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className={`p-3 rounded-lg ${
                                    comment.is_admin_response ? "bg-blue-50 border-l-4 border-blue-500" : "bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">
                                      {comment.is_admin_response
                                        ? "Support Team"
                                        : `${comment.first_name} ${comment.last_name}`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.comment}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="status">Update Status</Label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="adminComment">Admin Response</Label>
                              <Textarea
                                id="adminComment"
                                placeholder="Add your response to the user..."
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                rows={4}
                              />
                            </div>

                            <Button onClick={() => handleUpdateTicket(selectedTicket.id)} className="w-full">
                              Update Ticket
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
