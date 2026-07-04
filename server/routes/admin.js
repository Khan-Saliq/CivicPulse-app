import express from 'express'
import mongoose from 'mongoose'
import Issue from '../models/Issue.js'
import { authRequired, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Admin endpoint to fix all localhost image URLs
router.post('/fix-image-urls', authRequired, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Starting image URL fix...')
    
    // Find all issues with localhost URLs
    const issuesWithLocalhost = await Issue.find({
      imageUrl: { $regex: /localhost:5000/ }
    })

    console.log(`Found ${issuesWithLocalhost.length} issues with localhost URLs`)

    if (issuesWithLocalhost.length === 0) {
      return res.json({
        success: true,
        message: 'No localhost URLs found. All images are already using deployed URLs!',
        updated: 0
      })
    }

    // Get backend URL from environment or use default
    const backendUrl = process.env.VITE_API_URL?.replace('/api', '') || 'https://civicpulse-backend-5g51.onrender.com'
    
    const updatedIssues = []
    
    // Update each issue
    for (const issue of issuesWithLocalhost) {
      const oldUrl = issue.imageUrl
      const newUrl = oldUrl.replace('http://localhost:5000', backendUrl)
      
      console.log(`Updating issue: ${issue.title}`)
      console.log(`  Old: ${oldUrl}`)
      console.log(`  New: ${newUrl}`)
      
      issue.imageUrl = newUrl
      await issue.save()
      
      updatedIssues.push({
        id: issue._id,
        title: issue.title,
        oldUrl,
        newUrl
      })
    }

    console.log(`✅ Successfully updated ${updatedIssues.length} issues!`)

    res.json({
      success: true,
      message: `Successfully updated ${updatedIssues.length} issues`,
      updated: updatedIssues.length,
      issues: updatedIssues
    })

  } catch (error) {
    console.error('❌ Error fixing image URLs:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
