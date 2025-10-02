# ⚡ MentourMe Quick Start - Zero Cost Deployment

Deploy your complete MentourMe platform in **15 minutes** for **$0-5** total cost!

## 🚀 One-Command Deployment

```bash
# 1. Setup production environment
npm run setup-prod

# 2. Deploy everything
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. Verify deployment
node scripts/verify-deployment.js
```

## 📋 Pre-Deployment Checklist (5 minutes)

### 1. Create Service Accounts
- [ ] [Railway](https://railway.app) - Database hosting
- [ ] [Render](https://render.com) - Backend hosting  
- [ ] [Cloudflare](https://cloudflare.com) - Frontend hosting
- [ ] [Metered](https://metered.ca) - WebRTC servers
- [ ] [Mailgun](https://mailgun.com) - Email service

### 2. Get Your Credentials
- [ ] Railway: Database connection string
- [ ] Metered: API key and secret
- [ ] Mailgun: API key and domain
- [ ] Cloudflare: API token and account ID

## 🎯 Step-by-Step Deployment

### Step 1: Database (Railway) - 2 minutes
```bash
# Deploy MariaDB on Railway
railway login
railway new mentourme-db
railway add mariadb

# Get connection details
railway variables
```

### Step 2: Backend (Render) - 5 minutes
1. Go to [render.com](https://render.com/dashboard)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `mentourme-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Frontend (Cloudflare Pages) - 3 minutes
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click "Create a project" → "Connect to Git"
3. Select your repository
4. Configure:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Build output**: `dist`
   - **Root directory**: `client`

### Step 4: Configure Environment Variables - 3 minutes
Add these to your Render backend:
```bash
NODE_ENV=production
PORT=5000

# Database (from Railway)
DATABASE_URL=mysql://root:password@host:3306/railway

# Generated secrets (from setup script)
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret
ADMIN_API_TOKEN=your_generated_admin_token

# Frontend URL (from Cloudflare)
CLIENT_URL=https://your-app.pages.dev
ALLOWED_ORIGINS=https://your-app.pages.dev

# WebRTC (from Metered)
METERED_API_KEY=your_metered_api_key
METERED_SECRET_KEY=your_metered_secret_key

# Email (from Mailgun)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=sandbox-xxx.mailgun.org
MAILGUN_FROM_EMAIL=noreply@mentourme.com
```

### Step 5: GitHub Actions - 2 minutes
Add these secrets to your GitHub repository:
```bash
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-app.pages.dev
ADMIN_API_TOKEN=your_generated_admin_token
RENDER_DEPLOY_HOOK=your_render_deploy_hook
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## ✅ Verification

After deployment, verify everything works:

```bash
# Test all endpoints and services
node scripts/verify-deployment.js
```

Expected results:
- ✅ Backend health check passed
- ✅ Frontend is accessible  
- ✅ API endpoints responding
- ✅ SSL certificates valid
- ✅ CORS configuration working
- ✅ WebSocket setup correct

## 🎉 Success! Your Platform is Live

### URLs
- **Frontend**: `https://your-app.pages.dev`
- **Backend**: `https://your-backend.onrender.com`
- **API**: `https://your-backend.onrender.com/api`

### Features Ready
- ✅ User registration/login
- ✅ Mentorship matching
- ✅ Session scheduling  
- ✅ Real-time chat
- ✅ Video calls
- ✅ Email notifications
- ✅ Blog system
- ✅ Task management

## 💰 Cost Summary

| Service | Cost | Duration |
|---------|------|----------|
| Railway | $5 | ~30 days |
| All others | $0 | Forever (with limits) |
| **Total** | **$5** | **Monthly** |

## 🔧 Troubleshooting

### Common Issues

**Backend not starting?**
- Check environment variables in Render dashboard
- Verify database connection string
- Check Render logs for errors

**Frontend not loading?**
- Verify build completed successfully
- Check Cloudflare Pages deployment logs
- Ensure environment variables are set

**Database connection failed?**
- Verify Railway database is running
- Check connection string format
- Ensure SSL is enabled

**WebRTC not working?**
- Verify Metered credentials
- Check browser console for errors
- Ensure HTTPS is enabled

### Getting Help

1. Check deployment logs in service dashboards
2. Run verification script: `node scripts/verify-deployment.js`
3. Review `DEPLOYMENT.md` for detailed instructions
4. Check `DEPLOYMENT_CHECKLIST.md` for step-by-step guide

## 🚀 Next Steps

1. **Customize branding** - Update logos, colors, and text
2. **Add content** - Create initial blog posts and mentors
3. **Test features** - Try all functionality end-to-end
4. **Monitor usage** - Watch service dashboards for limits
5. **Scale up** - Upgrade to paid tiers as you grow

Your MentourMe platform is now live and ready for users! 🎯
