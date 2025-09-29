import { neon } from "@neondatabase/serverless"

// Database connection singleton
let sql: ReturnType<typeof neon> | null = null

export function getDatabase() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sql = neon(databaseUrl)
  }
  return sql
}

// Helper function for local development file uploads
export function getUploadPath(filename: string): string {
  if (process.env.NODE_ENV === "development") {
    // For local development, store files in public/uploads
    return `/uploads/${filename}`
  }
  // For production, use Vercel Blob storage
  return filename
}

// Helper function to check if running locally
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL
}
