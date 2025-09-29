"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

interface Service {
  id: string
  name: string
  category: string
  icon: string
  description: string
  is_enabled: boolean
}

interface ServicesManagerProps {
  userId: string
}

export function ServicesManager({ userId }: ServicesManagerProps) {
  const [services, setServices] = useState<Record<string, Service[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchServices()
  }, [userId])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/hotels/services", {
        headers: {
          "x-user-id": userId,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }

      const data = await response.json()
      setServices(data.services)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (serviceId: string, enabled: boolean) => {
    setChanges((prev) => ({
      ...prev,
      [serviceId]: enabled,
    }))

    // Update local state
    setServices((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((category) => {
        updated[category] = updated[category].map((service) =>
          service.id === serviceId ? { ...service, is_enabled: enabled } : service,
        )
      })
      return updated
    })
  }

  const saveChanges = async () => {
    if (Object.keys(changes).length === 0) return

    setSaving(true)
    try {
      const serviceUpdates = Object.entries(changes).map(([serviceId, isEnabled]) => ({
        serviceId,
        isEnabled,
      }))

      const response = await fetch("/api/hotels/services", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ serviceUpdates }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      setChanges({})
      toast({
        title: "Success",
        description: "Services updated successfully",
      })
    } catch (error) {
      console.error("Error saving services:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(changes).length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Services Management</h3>
          <p className="text-sm text-muted-foreground">Enable or disable services offered by your hotel</p>
        </div>
        {hasChanges && (
          <Button onClick={saveChanges} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        )}
      </div>

      {Object.entries(services).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
            <CardDescription>
              {categoryServices.filter((s) => s.is_enabled).length} of {categoryServices.length} services enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl">{service.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{service.name}</h4>
                      <Switch
                        checked={service.is_enabled}
                        onCheckedChange={(checked) => toggleService(service.id, checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                    {service.is_enabled && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
