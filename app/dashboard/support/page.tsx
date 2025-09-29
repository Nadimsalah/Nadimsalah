"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Plus, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import FileUploadZone from "@/components/file-upload-zone"

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
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

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketDetails, setTicketDetails] = useState<{
    ticket: SupportTicket
    comments: TicketComment[]
    attachments: any[]
  } | null>(null)
  const [newComment, setNewComment] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch("/api/support-tickets", {
        headers: {
          "user-id": user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let uploadedAttachments = []
      if (attachments.length > 0) {
        setUploadingAttachments(true)
        uploadedAttachments = await uploadAttachments(attachments)
        setUploadingAttachments(false)
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}")

      console.log("[v0] Submitting ticket with data:", { ...formData, attachments: uploadedAttachments })

      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id,
        },
        body: JSON.stringify({
          ...formData,
          attachments: uploadedAttachments,
        }),
      })

      const responseData = await response.json()
      console.log("[v0] API Response:", responseData)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Support ticket submitted successfully",
        })
        setFormData({ subject: "", description: "", priority: "medium" })
        setAttachments([])
        fetchTickets()
      } else {
        throw new Error(responseData.error || "Failed to submit ticket")
      }
    } catch (error) {
      console.error("[v0] Ticket submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit support ticket",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadingAttachments(false)
    }
  }

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        headers: {
          "user-id": user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTicketDetails(data)
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error)
    }
  }

  const handleAddComment = async (ticketId: string) => {
    if (!newComment.trim()) return

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id,
        },
        body: JSON.stringify({ comment: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        fetchTicketDetails(ticketId)
        toast({
          title: "Success",
          description: "Comment added successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadAttachments = async (files: File[]) => {
    const uploadedFiles = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const { url } = await response.json()
        uploadedFiles.push({
          fileName: file.name,
          fileUrl: url,
          fileSize: file.size,
          fileType: file.type,
        })
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }

    return uploadedFiles
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">Submit support tickets and track their progress</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you resolve it as quickly as possible.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <FileUploadZone
                  onFilesSelected={handleFileUpload}
                  selectedFiles={attachments}
                  onRemoveFile={removeAttachment}
                  maxFiles={5}
                  maxSizePerFile={10}
                  acceptedTypes={["image/*", ".pdf", ".txt", ".doc", ".docx"]}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button type="submit" disabled={isSubmitting || uploadingAttachments}>
                  {uploadingAttachments ? "Uploading files..." : isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No support tickets yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                When you need help, submit a support ticket and we'll assist you promptly.
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {ticket.comment_count} comments
                    </span>
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
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
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
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-muted-foreground">{ticketDetails.ticket.description}</p>
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

                            {selectedTicket?.status !== "closed" && (
                              <div>
                                <Label htmlFor="newComment">Add Comment</Label>
                                <div className="flex space-x-2 mt-2">
                                  <Textarea
                                    id="newComment"
                                    placeholder="Add your comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                  />
                                  <Button
                                    onClick={() => handleAddComment(selectedTicket.id)}
                                    disabled={!newComment.trim()}
                                  >
                                    Send
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
