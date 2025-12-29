# Deployment Guide - Location Tracker

## Free Hosting Deployment

This guide will help you deploy the Location Tracker app to free hosting services.

### Prerequisites
- GitHub account
- Render account (free tier) - https://render.com
- Netlify account (free tier) - https://netlify.com

---

## Step 1: Deploy Backend to Render (Free)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign up/login (free account)

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

4. **Configure Backend Service**
   - **Name**: `location-tracker-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty (root)

5. **Set Environment Variables** (in Render dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   BASE_URL=https://your-frontend-url.netlify.app
   BACKEND_URL=https://your-backend-url.onrender.com
   FRONTEND_URL=https://your-frontend-url.netlify.app
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL (e.g., `https://location-tracker-backend.onrender.com`)

---

## Step 2: Deploy Frontend to Netlify (Free)

1. **Build the frontend locally first** (to test):
   ```bash
   cd client
   npm run build
   ```

2. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign up/login (free account)

3. **Deploy from Git**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository

4. **Configure Build Settings**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`

5. **Set Environment Variables** (in Netlify dashboard):
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

6. **Deploy**
   - Click "Deploy site"
   - Wait for deployment (2-5 minutes)
   - Copy your frontend URL (e.g., `https://location-tracker.netlify.app`)

---

## Step 3: Update Environment Variables

After both are deployed, update the environment variables:

### In Render (Backend):
Update `BASE_URL` and `FRONTEND_URL` to your Netlify URL:
```
BASE_URL=https://your-frontend-url.netlify.app
FRONTEND_URL=https://your-frontend-url.netlify.app
BACKEND_URL=https://your-backend-url.onrender.com
```

### In Netlify (Frontend):
Update `REACT_APP_API_URL` to your Render backend URL:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

Then **redeploy both services** to apply changes.

---

## Step 4: Test Your Deployment

1. Visit your Netlify frontend URL
2. Generate a new link
3. Download the file
4. Test location tracking

---

## Alternative: Deploy to Railway (All-in-One)

Railway can host both frontend and backend:

1. **Go to Railway**: https://railway.app
2. **Create New Project** → "Deploy from GitHub repo"
3. **Add Backend Service**:
   - Select your repo
   - Root directory: `/`
   - Start command: `npm start`
   - Port: 3001

4. **Add Frontend Service**:
   - Add another service from same repo
   - Root directory: `/client`
   - Build command: `npm run build`
   - Start command: `npx serve -s build`

5. **Set Environment Variables** for both services

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Render: Services sleep after 15 minutes of inactivity (wakes up on request)
- Netlify: 100GB bandwidth/month, unlimited builds
- Railway: $5 free credit/month

⚠️ **For Production:**
- Use a database (MongoDB Atlas free tier) instead of in-memory storage
- Add proper authentication
- Use environment variables for sensitive data
- Enable HTTPS (automatic on both platforms)

---

## Troubleshooting

**Backend not receiving requests:**
- Check CORS settings in `server/index.js`
- Verify environment variables are set correctly
- Check Render logs for errors

**Frontend can't connect to backend:**
- Verify `REACT_APP_API_URL` is set correctly
- Check that backend URL is accessible
- Look at browser console for CORS errors

**Location tracking not working:**
- Ensure backend is running (not sleeping)
- Check that server URL in downloaded HTML is correct
- Verify geolocation permissions are granted

---

## Support

If you encounter issues:
1. Check deployment logs in Render/Netlify dashboard
2. Verify all environment variables are set
3. Test locally first before deploying
4. Check browser console for errors

