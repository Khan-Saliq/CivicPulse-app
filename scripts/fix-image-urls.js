import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: `${__dirname}/../.env` })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

async function fixImageUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB Atlas')

    // Get the Issue model
    const Issue = mongoose.model('Issue')

    // Find all issues with localhost URLs
    const issuesWithLocalhost = await Issue.find({
      imageUrl: { $regex: /localhost:5000/ }
    })

    console.log(`📊 Found ${issuesWithLocalhost.length} issues with localhost URLs`)

    if (issuesWithLocalhost.length === 0) {
      console.log('✅ No localhost URLs found. All images are already using deployed URLs!')
      return
    }

    // Update each issue
    const backendUrl = process.env.VITE_API_URL?.replace('/api', '') || 'https://civicpulse-backend-5g51.onrender.com'
    
    for (const issue of issuesWithLocalhost) {
      const oldUrl = issue.imageUrl
      const newUrl = oldUrl.replace('http://localhost:5000', backendUrl)
      
      console.log(`\n📝 Updating issue: ${issue.title}`)
      console.log(`   Old: ${oldUrl}`)
      console.log(`   New: ${newUrl}`)
      
      issue.imageUrl = newUrl
      await issue.save()
    }

    console.log(`\n✅ Successfully updated ${issuesWithLocalhost.length} issues!`)
    console.log(`\n🎉 All image URLs now point to: ${backendUrl}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

fixImageUrls()
