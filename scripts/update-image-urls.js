import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://khansaliq59:khansaliq59@cluster0.olu0j7y.mongodb.net/civicpulse?retryWrites=true&w=majority'

async function updateImageUrls() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const issuesCollection = db.collection('issues')

    // Find all issues with localhost image URLs
    const issues = await issuesCollection.find({
      $or: [
        { imagePath: { $regex: 'localhost:5000' } },
        { images: { $elemMatch: { $regex: 'localhost:5000' } } }
      ]
    }).toArray()

    console.log(`Found ${issues.length} issues with localhost URLs`)

    const deployedBackend = 'https://civicpulse-backend-5g51.onrender.com'

    for (const issue of issues) {
      const update = {}

      // Update imagePath
      if (issue.imagePath && issue.imagePath.includes('localhost:5000')) {
        update.imagePath = issue.imagePath.replace('http://localhost:5000', deployedBackend)
      }

      // Update images array
      if (issue.images && issue.images.length > 0) {
        update.images = issue.images.map(img => 
          img.replace('http://localhost:5000', deployedBackend)
        )
      }

      if (Object.keys(update).length > 0) {
        await issuesCollection.updateOne(
          { _id: issue._id },
          { $set: update }
        )
        console.log(`Updated issue ${issue._id}`)
      }
    }

    console.log('✅ Image URLs updated successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updateImageUrls()
