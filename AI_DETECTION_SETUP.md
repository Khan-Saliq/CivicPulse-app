# AI Detection Setup Guide

## Current Issue
The current heuristic-based AI detection produces false positives because it analyzes image properties (noise, edges) that can be similar in both real and AI-generated images.

## Solution: Use Free AI Detection APIs

### Option 1: Hive Moderation API (Recommended)
**Free Tier:** 1,000 requests/month
**Accuracy:** High - Uses multiple AI detection models

#### Setup Steps:
1. **Sign up for free API key:**
   - Go to: https://thehive.ai/
   - Click "Get Started" or "Sign Up"
   - Create an account
   - Navigate to API Keys section
   - Copy your API key

2. **Add to .env file:**
   ```
   HIVE_API_KEY=your_api_key_here
   ```

3. **Install required package:**
   ```bash
   cd server/python_chatbot
   pip install requests
   ```

### Option 2: Sightengine API
**Free Tier:** 200 requests/month (no credit card required)
**Accuracy:** Very High

#### Setup Steps:
1. **Sign up:**
   - Go to: https://sightengine.com/
   - Sign up for free account
   - Get API credentials from dashboard

2. **Add to .env:**
   ```
   SIGHTENGINE_USER=your_user_id
   SIGHTENGINE_SECRET=your_api_secret
   ```

### Option 3: Illuminarty AI
**Free Tier:** Limited free usage
**Accuracy:** High

#### Setup Steps:
1. **Sign up:**
   - Go to: https://illuminarty.ai/
   - Get API access

---

## Implementation Status

✅ Backend endpoint ready: `POST /api/chat/admin/validate-media`
✅ Python service structure ready
✅ Scanning animation implemented
✅ Excel export with filtering implemented

⏳ **Waiting for:** API key configuration to enable accurate AI detection

---

## Current Behavior (Without API Key)
- Uses heuristic analysis (noise, edges, frequency)
- May produce false positives
- Confidence scores vary based on image properties

## After API Key Setup
- Uses professional AI detection models
- Much higher accuracy
- Lower false positive rate
- Detects actual AI generation patterns, not just statistical anomalies

---

## Quick Test
After adding API key, test with:
1. A real photograph (should show "Authentic")
2. An AI-generated image (should show "AI-Generated")
3. Compare results with current heuristic method

---

## Cost Analysis
- **Hive:** 1,000 requests/month FREE, then $0.001 per request
- **Sightengine:** 200 requests/month FREE, then paid plans
- **OpenAI GPT-4o:** ~$0.01 per image analysis (requires billing)

For a civic app with moderate usage, free tiers should be sufficient.
