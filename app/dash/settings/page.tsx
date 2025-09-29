"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Shield, Trash2, RefreshCw, Download, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxHotelsPerUser: number
  maxProductsPerHotel: number
  maxStoriesPerHotel: number
  platformName: string
  supportEmail: string
  maxFileUploadSize: number
  sessionTimeout: number
  enableAnalytics: boolean
  enableNotifications: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maintenanceActions, setMaintenanceActions] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/super-admin/settings", {
        headers: {
          Authorization: "SuperAdmin token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch platform settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Network error while fetching settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "SuperAdmin token",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Platform settings have been updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save platform settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Network error while saving settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const runMaintenanceAction = async (action: string, actionName: string) => {
    setMaintenanceActions((prev) => ({ ...prev, [action]: true }))

    try {
      const response = await fetch("/api/super-admin/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "SuperAdmin token",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Maintenance completed",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to run ${actionName}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error running ${action}:`, error)
      toast({
        title: "Error",
        description: `Network error while running ${actionName}`,
        variant: "destructive",
      })
    } finally {
      setMaintenanceActions((prev) => ({ ...prev, [action]: false }))
    }
  }

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Failed to load settings</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and maintenance options</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-primary hover:bg-primary/90">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platformName" className="text-foreground">
                Platform Name
              </Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => updateSetting("platformName", e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-foreground">
                Support Email
              </Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting("supportEmail", e.target.value)}
                className="bg-background border-input"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable platform access for maintenance</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                />
                <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
                  {settings.maintenanceMode ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">User Registration</Label>
                <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => updateSetting("registrationEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">Enable platform analytics and monitoring</p>
              </div>
              <Switch
                checked={settings.enableAnalytics}
                onCheckedChange={(checked) => updateSetting("enableAnalytics", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Enable system notifications</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits & Quotas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Limits & Quotas
          </CardTitle>
          <CardDescription>Configure platform usage limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxHotelsPerUser" className="text-foreground">
                Max Hotels per User
              </Label>
              <Input
                id="maxHotelsPerUser"
                type="number"
                value={settings.maxHotelsPerUser}
                onChange={(e) => updateSetting("maxHotelsPerUser", Number.parseInt(e.target.value))}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxProductsPerHotel" className="text-foreground">
                Max Products per Hotel
              </Label>
              <Input
                id="maxProductsPerHotel"
                type="number"
                value={settings.maxProductsPerHotel}
                onChange={(e) => updateSetting("maxProductsPerHotel", Number.parseInt(e.target.value))}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStoriesPerHotel" className="text-foreground">
                Max Stories per Hotel
              </Label>
              <Input
                id="maxStoriesPerHotel"
                type="number"
                value={settings.maxStoriesPerHotel}
                onChange={(e) => updateSetting("maxStoriesPerHotel", Number.parseInt(e.target.value))}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxFileUploadSize" className="text-foreground">
                Max File Upload Size (MB)
              </Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                value={settings.maxFileUploadSize}
                onChange={(e) => updateSetting("maxFileUploadSize", Number.parseInt(e.target.value))}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-foreground">
                Session Timeout (hours)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting("sessionTimeout", Number.parseInt(e.target.value))}
                className="bg-background border-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-600" />
            Maintenance Tools
          </CardTitle>
          <CardDescription>System maintenance and optimization tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => runMaintenanceAction("cleanup_expired_stories", "Story Cleanup")}
              disabled={maintenanceActions.cleanup_expired_stories}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              {maintenanceActions.cleanup_expired_stories ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <span>Clean Expired Stories</span>
              <span className="text-xs text-muted-foreground">Remove expired story content</span>
            </Button>

            <Button
              onClick={() => runMaintenanceAction("optimize_database", "Database Optimization")}
              disabled={maintenanceActions.optimize_database}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              {maintenanceActions.optimize_database ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              <span>Optimize Database</span>
              <span className="text-xs text-muted-foreground">Improve database performance</span>
            </Button>

            <Button
              onClick={() => runMaintenanceAction("clear_cache", "Cache Clear")}
              disabled={maintenanceActions.clear_cache}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              {maintenanceActions.clear_cache ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <span>Clear Cache</span>
              <span className="text-xs text-muted-foreground">Clear application cache</span>
            </Button>

            <Button
              onClick={() => runMaintenanceAction("backup_database", "Database Backup")}
              disabled={maintenanceActions.backup_database}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              {maintenanceActions.backup_database ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Backup Database</span>
              <span className="text-xs text-muted-foreground">Create database backup</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      {settings.maintenanceMode && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-destructive font-medium">Maintenance Mode Active</p>
                <p className="text-muted-foreground text-sm">
                  The platform is currently in maintenance mode. Users cannot access their accounts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
