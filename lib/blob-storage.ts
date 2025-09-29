import { put } from "@vercel/blob"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { isLocalDevelopment } from "./database"

export interface UploadResult {
  url: string
  thumbnailUrl?: string
}

export async function uploadStoryFile(file: File, hotelId: string): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `stories/${hotelId}/${timestamp}.${extension}`

    if (isLocalDevelopment()) {
      // Local development: save to public/uploads
      return await uploadFileLocally(file, filename)
    }

    // Production: use Vercel Blob storage
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    let thumbnailUrl: string | undefined

    // Generate thumbnail for videos
    if (file.type.startsWith("video/")) {
      try {
        const thumbnailBlob = await generateVideoThumbnail(file)
        const thumbnailFilename = `stories/${hotelId}/${timestamp}_thumb.jpg`

        const thumbnailResult = await put(thumbnailFilename, thumbnailBlob, {
          access: "public",
          addRandomSuffix: false,
        })

        thumbnailUrl = thumbnailResult.url
      } catch (error) {
        console.error("Failed to generate video thumbnail:", error)
        // Continue without thumbnail
      }
    }

    return {
      url: blob.url,
      thumbnailUrl: file.type.startsWith("image/") ? blob.url : thumbnailUrl,
    }
  } catch (error) {
    console.error("Failed to upload file:", error)
    throw new Error("File upload failed")
  }
}

async function uploadFileLocally(file: File, filename: string): Promise<UploadResult> {
  const uploadDir = join(process.cwd(), "public", "uploads")
  const filePath = join(uploadDir, filename)

  // Create directory if it doesn't exist
  await mkdir(join(uploadDir, filename.split("/").slice(0, -1).join("/")), { recursive: true })

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Write file to local storage
  await writeFile(filePath, buffer)

  const url = `/uploads/${filename}`

  return {
    url,
    thumbnailUrl: file.type.startsWith("image/") ? url : undefined,
  }
}

async function generateVideoThumbnail(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Canvas context not available"))
      return
    }

    video.onloadedmetadata = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1)
    }

    video.onseeked = () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to generate thumbnail"))
          }
        },
        "image/jpeg",
        0.8,
      )
    }

    video.onerror = () => {
      reject(new Error("Video loading failed"))
    }

    // Load video
    video.src = URL.createObjectURL(videoFile)
    video.load()
  })
}
