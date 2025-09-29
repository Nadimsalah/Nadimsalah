"use client"

import { useEffect, useState } from "react"

const SuperAdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState({
    totalHotels: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeStores: 0,
    recentActivity: [],
    topHotels: [],
  })
  const [earnings, setEarnings] = useState({
    today: 0,
    yesterday: 0,
    week: 0,
    year: 0,
    custom: 0,
    earningsByHotel: [],
    dailyEarnings: [],
  })
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    fetchEarnings("today")
    fetchEarnings("yesterday")
    fetchEarnings("week")
    fetchEarnings("year")
  }, [])

  const fetchEarnings = async (period, startDate = null, endDate = null) => {
    try {
      let url = `/api/super-admin/earnings?period=${period}`
      if (startDate && endDate) {
        url = `/api/super-admin/earnings?startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (period === "custom") {
        setEarnings((prev) => ({
          ...prev,
          custom: data.totalEarnings || 0,
          earningsByHotel: data.earningsByHotel || [],
          dailyEarnings: data.dailyEarnings || [],
        }))
      } else {
        setEarnings((prev) => ({
          ...prev,
          [period]: data.totalEarnings || 0,
          earningsByHotel: data.earningsByHotel || [],
          dailyEarnings: data.dailyEarnings || [],
        }))
      }
    } catch (error) {
      console.error(`Error fetching ${period} earnings:`, error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/super-admin/analytics")
      const data = await response.json()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage the HotelTec SaaS platform performance.</p>
      </div>
      {/* Insert the rest of the code here */}
    </div>
  )
}

export default SuperAdminDashboardPage
