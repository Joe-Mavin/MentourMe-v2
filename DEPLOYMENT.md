# 🚀 MentourMe Free-Tier Deployment Guide

Deploy your MentourMe platform using 100% free services with $0-5 total cost.

## 📋 Services Overview

| Service | Purpose | Cost | Limits |
|---------|---------|------|--------|
| **Render** | Backend hosting | Free | 750 hours/month, sleeps after 15min |
| **Railway** | MariaDB database | $5 credits | ~1 month of usage |
| **Cloudflare Pages** | Frontend hosting | Free | Unlimited bandwidth |
| **Metered** | TURN/STUN servers | Free | 50GB/month |
| **Mailgun** | Email notifications | Free | 5,000 emails/month |
| **GitHub Actions** | Scheduled tasks | Free | 2,000 minutes/month |

## 🎯 Step-by-Step Deployment

### 1. Database Setup (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Verify you have $5 free credits

2. **Deploy MariaDB**
   ```bash
   # Create new project
   railway new
   
   # Add MariaDB service
   railway add mariadb
   ```

3. **Get Database Credentials**
   ```bash
   # View connection details
   railway variables
   ```
   
   Save these values:
   ```
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=generated_password
   DB_NAME=railway
   DATABASE_URL=mysql://root:password@host:3306/railway
   ```

### 2. Backend Deployment (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Connect your repository

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `server` folder as root directory
   - Use these settings:
     ```
     Name: mentourme-backend
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     ```

3. **Configure Environment Variables**
   Add these in Render dashboard:
   ```bash
   NODE_ENV=production
   PORT=5000
   
   # Database (from Railway)
   DB_HOST=your_railway_host
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_railway_password
   DB_NAME=railway
   DATABASE_URL=your_railway_connection_string
   
   # JWT (generate secure keys)
   JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
   JWT_EXPIRES_IN=7d
   SESSION_SECRET=your_super_secure_session_secret_minimum_32_characters
   
   # CORS
   ALLOWED_ORIGINS=https://mentourme.pages.dev
   CLIENT_URL=https://mentourme.pages.dev
   
   # Mailgun (setup below)
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=sandbox-xxx.mailgun.org
   MAILGUN_FROM_EMAIL=noreply@mentourme.com
   
   # Metered WebRTC (setup below)
   METERED_API_KEY=your_metered_api_key
   METERED_SECRET_KEY=your_metered_secret_key
   
   # Admin
   ADMIN_API_TOKEN=your_admin_token_for_scheduled_tasks
   ```

4. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://mentourme-backend.onrender.com`

### 3. Frontend Deployment (Cloudflare Pages)

1. **Create Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up for free account
   - Go to "Pages" in dashboard

2. **Connect Repository**
   - Click "Create a project"
   - Connect GitHub repository
   - Select your repository

3. **Configure Build Settings**
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: client
   ```

4. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   VITE_API_URL=https://mentourme-backend.onrender.com
   VITE_WS_URL=wss://mentourme-backend.onrender.com
   VITE_APP_NAME=MentourMe
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy Frontend**
   - Click "Save and Deploy"
   - Wait for build (3-5 minutes)
   - Note your frontend URL: `https://mentourme.pages.dev`

### 4. WebRTC Setup (Metered)

1. **Create Metered Account**
   - Go to [metered.ca](https://www.metered.ca)
   - Sign up for free account
   - Get 50GB free monthly bandwidth

2. **Get TURN/STUN Credentials**
   - Go to dashboard
   - Copy API Key and Secret Key
   - Add to Render environment variables:
   ```bash
   METERED_API_KEY=your_api_key
   METERED_SECRET_KEY=your_secret_key
   ```

### 5. Email Setup (Mailgun)

1. **Create Mailgun Account**
   - Go to [mailgun.com](https://www.mailgun.com)
   - Sign up for free account
   - Verify your account

2. **Get Sandbox Domain**
   - Go to "Sending" → "Domains"
   - Use sandbox domain (no custom domain needed)
   - Get API key from "Settings" → "API Keys"

3. **Configure Environment**
   ```bash
   MAILGUN_API_KEY=your_private_api_key
   MAILGUN_DOMAIN=sandbox-xxx.mailgun.org
   MAILGUN_FROM_EMAIL=noreply@mentourme.com
   ```

### 6. Scheduled Tasks (GitHub Actions)

1. **Set Repository Secrets**
   Go to GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   ```bash
   BACKEND_URL=https://mentourme-backend.onrender.com
   FRONTEND_URL=https://mentourme.pages.dev
   ADMIN_API_TOKEN=your_admin_token_for_scheduled_tasks
   RENDER_DEPLOY_HOOK=your_render_deploy_hook_url
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   VITE_API_URL=https://mentourme-backend.onrender.com
   VITE_WS_URL=wss://mentourme-backend.onrender.com
   ```

2. **Enable Actions**
   - Go to Actions tab in GitHub
   - Enable workflows
   - Workflows will run automatically

### 7. SSL & CDN (Cloudflare)

1. **Domain Setup (Optional)**
   - If you have a custom domain, add it to Cloudflare
   - Update DNS settings
   - Enable SSL/TLS encryption

2. **Security Settings**
   - Enable "Always Use HTTPS"
   - Set Security Level to "Medium"
   - Enable Bot Fight Mode

## 🔧 Configuration Files Created

- ✅ `server/Dockerfile` - Container configuration
- ✅ `server/render.yaml` - Render deployment config
- ✅ `server/healthcheck.js` - Health check endpoint
- ✅ `server/config/production.js` - Production configuration
- ✅ `client/wrangler.toml` - Cloudflare Pages config
- ✅ `client/_redirects` - URL redirects
- ✅ `client/_headers` - Security headers
- ✅ `client/.env.production` - Production environment
- ✅ `.github/workflows/deploy.yml` - Deployment automation
- ✅ `.github/workflows/scheduled-tasks.yml` - Cron jobs
- ✅ `railway.json` - Railway configuration

## 🚨 Important Notes

### Cost Management
- **Railway**: Monitor database usage to stay within $5 credits
- **Render**: App sleeps after 15min inactivity (free tier limitation)
- **All other services**: Completely free within limits

### Performance Considerations
- **Cold starts**: Render apps take 10-30s to wake up
- **Database connections**: Limited concurrent connections on Railway
- **File uploads**: Use temporary storage on Render (files deleted on restart)

### Security
- **Environment variables**: Never commit secrets to repository
- **HTTPS only**: All services configured for SSL/TLS
- **CORS**: Properly configured for cross-origin requests

## 🔍 Monitoring & Maintenance

### Health Checks
- Backend: `https://mentourme-backend.onrender.com/health`
- Frontend: `https://mentourme.pages.dev`
- Database: Monitor Railway dashboard

### Logs
- **Render**: View logs in dashboard
- **Cloudflare**: Check Functions logs
- **GitHub Actions**: Monitor workflow runs

### Scheduled Tasks
- Session reminders: Every hour
- Daily cleanup: 2 AM UTC
- Weekly reports: Sundays 3 AM UTC

## 🚀 Deployment Commands

### Initial Deployment
```bash
# 1. Push to GitHub (triggers deployment)
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Monitor deployments
# - Check Render dashboard
# - Check Cloudflare Pages dashboard
# - Check GitHub Actions
```

### Manual Deployment
```bash
# Backend (Render)
curl -X POST "your_render_deploy_hook_url"

# Frontend (Cloudflare Pages)
# Automatically deploys on git push
```

## 🎯 Success Checklist

- [ ] Railway MariaDB running
- [ ] Render backend deployed and healthy
- [ ] Cloudflare Pages frontend deployed
- [ ] Environment variables configured
- [ ] WebRTC TURN/STUN working
- [ ] Email notifications working
- [ ] GitHub Actions scheduled tasks running
- [ ] SSL certificates active
- [ ] All services communicating properly

## 💰 Total Cost: $0-5

- Railway: $5 (one-time credits, lasts ~1 month)
- All other services: $0 (free tier)

Your MentourMe platform is now deployed on enterprise-grade infrastructure at minimal cost! 🎉
