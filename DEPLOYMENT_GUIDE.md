# CivicPulse Deployment Guide - Vercel + Render (Free)

## 📋 Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)
- MongoDB Atlas account (free)

## 🚀 Step-by-Step Deployment

### **Step 1: Push to GitHub**

1. Create a new GitHub repository (e.g., `civicpulse-app`)
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/civicpulse-app.git
git push -u origin main
```

---

### **Step 2: Deploy MongoDB Atlas (Free)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0 tier - 512MB)
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get your connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civicpulse?retryWrites=true&w=majority
   ```

---

### **Step 3: Deploy Backend to Render**

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `civicpulse-backend`
   - **Region**: Oregon (or closest)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`

5. Add Environment Variables (click "Environment" tab):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civicpulse
   JWT_SECRET=civicpulse-jwt-secret-change-in-production
   VITE_API_URL=https://your-app.vercel.app/api
   HIVE_SECRET_KEY=IUDglfRhLje/u/kAr4EyMg==
   SEED_DATABASE=true
   ```

6. Click "Create Web Service"
7. Wait for deployment (~5 minutes)
8. Copy the backend URL (e.g., `https://civicpulse-backend.onrender.com`)

---

### **Step 4: Deploy Python Service to Render**

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `civicpulse-python`
   - **Region**: Oregon (same as backend)
   - **Branch**: `main`
   - **Root Directory**: `server/python_chatbot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port 8000`
   - **Instance Type**: `Free`

4. Add Environment Variables:
   ```
   PYTHONUNBUFFERED=1
   HIVE_SECRET_KEY=IUDglfRhLje/u/kAr4EyMg==
   ```

5. Click "Create Web Service"
6. Copy the Python service URL (e.g., `https://civicpulse-python.onrender.com`)

---

### **Step 5: Update Backend Environment Variable

1. Go back to your backend service in Render
2. Click "Environment" tab
3. Update:
   ```
   PYTHON_AI_SERVICE_URL=https://civicpulse-python.onrender.com
   ```
4. Click "Save Changes"
5. Backend will automatically redeploy

---

### **Step 6: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://civicpulse-backend.onrender.com/api
   ```

6. Click "Deploy"
7. Wait for deployment (~2 minutes)
8. Copy your frontend URL (e.g., `https://civicpulse.vercel.app`)

---

### **Step 7: Update Backend CORS

1. Go back to backend service in Render
2. Update environment variable:
   ```
   VITE_API_URL=https://civicpulse.vercel.app/api
   ```
3. Save and wait for redeployment

---

## ✅ Test Your Deployment

1. Visit your Vercel URL: `https://civicpulse.vercel.app`
2. Register a new user
3. Test issue reporting
4. Test AI image validation

---

## 🔧 Troubleshooting

### Backend not starting?
- Check logs in Render dashboard
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Ensure all environment variables are set

### Python service not connecting?
- Verify both services are in the same Render region
- Check `PYTHON_AI_SERVICE_URL` is correct
- Check Python service logs

### Frontend can't connect to backend?
- Verify `VITE_API_URL` points to your Render backend URL
- Check CORS settings in `server/index.js`

### Database not seeding?
- Set `SEED_DATABASE=true` in backend environment
- Redeploy backend service

---

## 📊 Free Tier Limitations

**Render (Free)**:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month total (shared across all services)

**Vercel (Free)**:
- 100 GB bandwidth/month
- Unlimited deployments
- Serverless functions (no persistent connections)

**MongoDB Atlas (Free)**:
- 512 MB storage
- Shared RAM
- Basic support

---

## 🔄 Making Updates

After deployment, to update your code:

```bash
git add .
git commit -m "Update description"
git push origin main
```

Both Vercel and Render will automatically redeploy!

---

## 🎯 Your Deployment URLs

- **Frontend**: `https://civicpulse.vercel.app`
- **Backend API**: `https://civicpulse-backend.onrender.com`
- **Python Service**: `https://civicpulse-python.onrender.com`
- **Database**: MongoDB Atlas (cloud)

---

## 📝 Notes

- Free tier is sufficient for development/demo
- Services may have cold starts (30-60 seconds)
- Monitor usage in Render/Vercel dashboards
- For production, consider paid plans ($7-20/month)

---

**Need Help?**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
