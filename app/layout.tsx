import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/providers/query-provider"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  title: "Pulse - News Aggregator",
  description: "Stay informed with real-time news from trusted sources worldwide",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
