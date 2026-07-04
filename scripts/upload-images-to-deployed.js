import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BACKEND_URL = 'https://civicpulse-backend-5g51.onrender.com'
const UPLOADS_DIR = path.join(__dirname, '..', 'server', 'uploads')

async function uploadImages() {
  try {
    console.log('📤 Uploading images to deployed backend...')
    console.log(`Backend URL: ${BACKEND_URL}`)
    console.log(`Uploads directory: ${UPLOADS_DIR}\n`)

    // Get all files in uploads directory
    const files = fs.readdirSync(UPLOADS_DIR)
    
    if (files.length === 0) {
      console.log('✅ No files to upload!')
      return
    }

    console.log(`Found ${files.length} files to upload\n`)

    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file)
      const fileBuffer = fs.readFileSync(filePath)
      const base64Data = fileBuffer.toString('base64')
      
      // Determine MIME type
      const ext = path.extname(file).toLowerCase()
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
      
      console.log(`📤 Uploading: ${file}`)
      
      const response = await fetch(`${BACKEND_URL}/api/uploads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: `data:${mimeType};base64,${base64Data}`,
          filename: file
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Uploaded: ${result.url}\n`)
      } else {
        const error = await response.text()
        console.error(`❌ Failed to upload ${file}: ${error}\n`)
      }
    }

    console.log('✅ All images uploaded!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

uploadImages()
