"use client"

import { Suspense, useEffect } from "react"
import SuperAdminLogin from "./login"

export default function SuperAdminDashPage() {
  useEffect(() => {
    console.log("[v0] Super Admin /super-admin route loaded successfully")
    console.log("[v0] Current URL:", window.location.href)
    console.log("[v0] Current domain:", window.location.hostname)
  }, [])

  return (
    <div>
      <div className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-xs z-50">
        /super-admin route active
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <SuperAdminLogin />
      </Suspense>
    </div>
  )
}
