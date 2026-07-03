# 🚀 Quick Deployment Checklist

## ✅ Before You Start

- [ ] GitHub account created
- [ ] Vercel account created (https://vercel.com)
- [ ] Render account created (https://render.com)
- [ ] MongoDB Atlas account created (https://mongodb.com/cloud/atlas)

## 📦 Step 1: Prepare Your Code

```bash
# Run the preparation script
bash prepare-deployment.sh

# OR manually:
git init
git add .
git commit -m "Prepare for deployment"
```

## 🐵 Step 2: Push to GitHub

1. Create new repository on GitHub (e.g., `civicpulse-app`)
2. Copy the commands GitHub shows you
3. Push your code:
   ```bash
   git remote add origin YOUR_GITHUB_URL
   git branch -M main
   git push -u origin main
   ```

## 🗄️ Step 3: MongoDB Atlas Setup

1. Log in to MongoDB Atlas
2. Create FREE cluster (M0 - 512MB)
3. Create Database User:
   - Username: `civicpulse`
   - Password: (save this!)
4. Network Access → Add IP: `0.0.0.0/0`
5. Get connection string (looks like):
   ```
   mongodb+srv://civicpulse:PASSWORD@cluster0.xxxxx.mongodb.net/civicpulse
   ```

## 🔧 Step 4: Deploy Backend (Render)

1. Render Dashboard → "New +" → "Web Service"
2. Connect GitHub → Select your repo
3. Settings:
   - Name: `civicpulse-backend`
   - Region: Oregon
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Instance Type: **FREE**

4. Environment Variables (add these):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://civicpulse:PASSWORD@cluster0.xxxxx.mongodb.net/civicpulse
   JWT_SECRET=civicpulse-jwt-secret-2024
   VITE_API_URL=https://civicpulse.vercel.app/api
   HIVE_SECRET_KEY=IUDglfRhLje/u/kAr4EyMg==
   SEED_DATABASE=true
   ```

5. Click "Create Web Service"
6. **COPY THE URL**: `https://civicpulse-backend.onrender.com`

## 🐍 Step 5: Deploy Python Service (Render)

1. "New +" → "Web Service"
2. Connect GitHub → Select your repo
3. Settings:
   - Name: `civicpulse-python`
   - Root Directory: `server/python_chatbot`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port 8000`
   - Instance Type: **FREE**

4. Environment Variables:
   ```
   PYTHONUNBUFFERED=1
   HIVE_SECRET_KEY=IUDglfRhLje/u/kAr4EyMg==
   ```

5. Click "Create Web Service"
6. **COPY THE URL**: `https://civicpulse-python.onrender.com`

## 🔄 Step 6: Update Backend URL

1. Go back to `civicpulse-backend` in Render
2. Environment tab → Add/Update:
   ```
   PYTHON_AI_SERVICE_URL=https://civicpulse-python.onrender.com
   ```
3. Save → Auto-redeploy

## 🎨 Step 7: Deploy Frontend (Vercel)

1. Vercel Dashboard → "Add New..." → "Project"
2. Import GitHub → Select your repo
3. Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Environment Variables:
   ```
   VITE_API_URL=https://civicpulse-backend.onrender.com/api
   ```

5. Click "Deploy"
6. **COPY THE URL**: `https://civicpulse.vercel.app`

## 🔗 Step 8: Final Update

1. Backend (Render) → Environment → Update:
   ```
   VITE_API_URL=https://civicpulse.vercel.app/api
   ```
2. Save → Wait for redeploy

## ✅ Test Your App

1. Visit: `https://civicpulse.vercel.app`
2. Register new user
3. Test features:
   - [ ] Login/Signup works
   - [ ] Can report issue
   - [ ] Can upload image
   - [ ] AI validation works
   - [ ] Dashboard loads

## 🎉 You're Live!

Your app is now deployed and accessible worldwide!

---

## 📊 Your Service URLs

| Service | URL |
|---------|-----|
| Frontend | https://civicpulse.vercel.app |
| Backend API | https://civicpulse-backend.onrender.com |
| Python Service | https://civicpulse-python.onrender.com |
| Database | MongoDB Atlas (cloud) |

---

## 🆘 Common Issues

**Backend not starting?**
- Check MongoDB IP whitelist includes `0.0.0.0/0`
- Verify all environment variables are set

**Python service error?**
- Ensure both services in same region (Oregon)
- Check `PYTHON_AI_SERVICE_URL` is correct

**Frontend can't connect?**
- Verify `VITE_API_URL` points to backend URL
- Check backend logs for CORS errors

**Need more help?**
- Read full guide: `DEPLOYMENT_GUIDE.md`
