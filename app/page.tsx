"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContactForm } from "@/components/contact-form"
import { Store, QrCode, Check, Star, Users, Zap, Bell, Package, Eye, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(savedTheme === "dark" || (!savedTheme && systemDark))

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center">
            <Image
              src={isDark ? "/images/hoteltec-logo-dark.png" : "/images/hoteltec-logo.png"}
              alt="HotelTec"
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              asChild
              className="sm:hidden text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hidden sm:inline-flex text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white shadow-sm"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-16">
            <Badge
              variant="secondary"
              className="mb-8 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0"
            >
              Hotels, Reinvented
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 dark:text-white leading-tight tracking-tight">
              Transform your hotel
              <br />
              <span className="text-gray-600 dark:text-gray-400">into a digital store</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Empower guests with seamless shopping, boost revenue, and deliver memorable experiences—all with one QR
              scan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button
              size="lg"
              className="text-base px-8 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white shadow-sm"
              asChild
            >
              <Link href="#pricing">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
              asChild
            >
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>

          <div className="mb-16">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider font-medium">
              Trusted By Hotels Worldwide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">500+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Hotels Onboarded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">2M+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Orders Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">98%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Guest Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">+35%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Revenue Growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Everything your hotel needs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools to transform your hotel into a modern retail experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <Store className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">One-Click Hotel Store</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Launch instantly with drag-and-drop products and mobile-first design. Create your hotel store in
                  seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <QrCode className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">QR Magic</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Guests shop instantly with room-specific QR codes. No downloads, no registrations - pure convenience.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <Package className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Smart Orders</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Real-time tracking, instant alerts, automated updates. Keep guests informed throughout their journey.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Engaging Stories</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Share visual offers, amenities, and hotel experiences. Create memorable moments with storytelling.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <Bell className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Smart Notifications</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Stay connected with instant updates and alerts. Never miss an opportunity to serve guests better.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Premium Experience</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Deliver trustworthy, innovative experiences that feel premium. Build guest loyalty with every
                  interaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Start small, test instantly. Upgrade when you're ready to unlock the full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Free Trial</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                  <span className="text-gray-500 dark:text-gray-400">/14 days</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Start small, test instantly</p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Up to 5 products</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Unlimited QR codes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Basic analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Email support</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white"
                  asChild
                >
                  <Link href="/checkout?plan=free-trial">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 border-gray-900 dark:border-white bg-white dark:bg-gray-900 shadow-sm relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">6-Month Pack</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$299</span>
                  <span className="text-gray-500 dark:text-gray-400">/6 months</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Most popular, full features</p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Unlimited products</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Custom branding</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Priority support</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white"
                  asChild
                >
                  <Link href="/checkout?plan=6-month-pack">Get 6-Month Pack</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="p-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">12-Month Pack</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$499</span>
                  <span className="text-gray-500 dark:text-gray-400">/12 months</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Best value, white-label + support</p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Everything in 6-Month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">White-label solution</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">24/7 phone support</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white"
                  asChild
                >
                  <Link href="/checkout?plan=12-month-pack">Get 12-Month Pack</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-900 dark:bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white dark:text-gray-900">
            Your hotel can go live in 24 hours
          </h2>
          <p className="text-xl mb-8 text-gray-300 dark:text-gray-600 max-w-2xl mx-auto">
            Join hundreds of hotels already growing with HotelTec. Transform your guest experience today.
          </p>
          <Button
            size="lg"
            className="bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-white px-8 py-3"
            asChild
          >
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="contact" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Let's build together</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ready to transform your hotel? Our team of experts will guide you through every step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
              <ContactForm />
            </div>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Dedicated Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our team of hotel tech experts will guide you through setup and optimization.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Quick Implementation</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go live in under 24 hours with our streamlined onboarding process.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Proven Results</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Average 35% increase in ancillary revenue within the first month.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-16 px-6 bg-white dark:bg-gray-950">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Image
                src={isDark ? "/images/hoteltec-logo-dark.png" : "/images/hoteltec-logo.png"}
                alt="HotelTec"
                width={160}
                height={40}
                className="h-8 w-auto object-contain mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400">Transforming hotels with smart technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#services" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#demo" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Support</h4>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 HotelTec. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
