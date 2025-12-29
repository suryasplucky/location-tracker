# 🚀 Automatic Deployment from GitHub

This guide shows you how to set up **automatic deployment** directly from your GitHub repository using GitHub Actions.

## Option 1: GitHub Actions + Render + Netlify (Automated)

### Setup (One-time, 5 minutes)

#### Step 1: Get Render API Key
1. Go to https://dashboard.render.com
2. Click your profile → **Account Settings**
3. Go to **API Keys** section
4. Click **Create API Key**
5. Name it: `github-actions`
6. **Copy the API Key**

#### Step 2: Get Render Service ID
1. Deploy your backend once manually (follow SIMPLE_DEPLOY.md Step 1)
2. Go to your service → **Settings** tab
3. Scroll down to find **Service ID**
4. **Copy the Service ID**

#### Step 3: Get Netlify Auth Token
1. Go to https://app.netlify.com/user/applications
2. Click **New access token**
3. Description: `GitHub Actions`
4. **Copy the token**

#### Step 4: Get Netlify Site ID
1. Deploy your frontend once manually (follow SIMPLE_DEPLOY.md Step 2)
2. Go to **Site settings** → **General**
3. Find **Site details** → **Site ID**
4. **Copy the Site ID**

#### Step 5: Add Secrets to GitHub
1. Go to: https://github.com/suryasplucky/location-tracker/settings/secrets/actions
2. Click **New repository secret** for each:
   - `RENDER_API_KEY` → Paste your Render API key
   - `RENDER_SERVICE_ID` → Paste your Render service ID
   - `NETLIFY_AUTH_TOKEN` → Paste your Netlify token
   - `NETLIFY_SITE_ID` → Paste your Netlify site ID
   - `REACT_APP_API_URL` → `https://your-backend-url.onrender.com/api`

### How It Works

✅ **After setup, every time you push to GitHub:**
- Backend automatically deploys to Render
- Frontend automatically deploys to Netlify
- No manual steps needed!

---

## Option 2: Vercel (Easiest - All-in-One)

Vercel can deploy both frontend and backend automatically!

### Deploy to Vercel (2 minutes)

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub (free)
3. **Click:** "Add New Project"
4. **Import:** `suryasplucky/location-tracker`
5. **Configure:**
   - **Framework Preset:** Other
   - **Root Directory:** `client` (for frontend)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
6. **Environment Variables:**
   - `REACT_APP_API_URL` = (will set after backend deploy)
7. **Deploy!**

### Deploy Backend to Vercel

1. **Add another project** in Vercel
2. **Same repository:** `location-tracker`
3. **Configure:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Output Directory:** (leave empty)
   - **Install Command:** `npm install`
4. **Deploy!**

**Vercel automatically:**
- ✅ Detects changes
- ✅ Auto-deploys on every push
- ✅ Provides free HTTPS
- ✅ No configuration needed!

---

## Option 3: Railway (Simplest - One Click)

Railway can deploy everything automatically!

### Deploy to Railway (3 minutes)

1. **Go to:** https://railway.app
2. **Sign up** with GitHub (free $5 credit/month)
3. **Click:** "New Project"
4. **Select:** "Deploy from GitHub repo"
5. **Choose:** `location-tracker`
6. **Railway auto-detects** and deploys!

**Railway automatically:**
- ✅ Detects Node.js
- ✅ Auto-builds and deploys
- ✅ Provides free domain
- ✅ Auto-deploys on every push

---

## Recommended: Vercel (Easiest)

**Why Vercel?**
- ✅ Automatic deployments
- ✅ Free tier
- ✅ Easy setup
- ✅ Great for React apps
- ✅ Auto HTTPS

**Quick Start:**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import `location-tracker`
4. Deploy!

That's it! 🎉

---

## Which Should You Choose?

| Platform | Setup Time | Auto-Deploy | Free Tier |
|----------|------------|-------------|-----------|
| **Vercel** | 2 min | ✅ Yes | ✅ Generous |
| **Railway** | 3 min | ✅ Yes | ✅ $5/month credit |
| **Render+Netlify** | 10 min | ⚠️ Manual | ✅ Yes |
| **GitHub Actions** | 15 min | ✅ Yes | ✅ Free |

**My Recommendation:** Start with **Vercel** - it's the easiest!

