# 🔍 Render Debugging Guide - Nodemailer Issue

## 🎯 Current Issue

Nodemailer is showing as "not a function" on Render, even though:
- ✅ Environment variables are set correctly
- ✅ Package.json includes nodemailer@^7.0.6
- ✅ Code works locally

## 📊 What I've Added for Debugging

The latest deployment includes comprehensive logging that will show us exactly what's happening.

## 🔎 How to Check Render Logs

### **Step 1: Access Render Logs**
1. Go to https://dashboard.render.com
2. Click on your backend service (mentourme-v2)
3. Click on "Logs" tab
4. Wait for the latest deployment to finish

### **Step 2: Look for These Log Messages**

After deployment completes, look for these specific messages in the logs:

#### **✅ Success Pattern:**
```
✅ Nodemailer loaded successfully
📦 Module info: { type: 'object', hasCreateTransporter: 'function', isFunction: true }
🔧 Creating email transporter...
✅ Transporter created successfully
✅ SMTP connection verified - Email service ready!
```

#### **❌ Failure Patterns:**

**Pattern 1: Module Not Found**
```
❌ Failed to load nodemailer: Cannot find module 'nodemailer'
```
**Solution**: Nodemailer not installed - need to check Render build logs

**Pattern 2: Wrong Module Type**
```
✅ Nodemailer loaded successfully
📦 Module info: { type: 'string', hasCreateTransporter: 'undefined', isFunction: false }
❌ nodemailer.createTransporter is not a function
Available properties: [...]
```
**Solution**: Module loaded incorrectly - might be a caching issue

**Pattern 3: Module is Object but Missing Function**
```
✅ Nodemailer loaded successfully
📦 Module info: { type: 'object', hasCreateTransporter: 'undefined', isFunction: false }
Available properties: [...]
```
**Solution**: Corrupted installation - need to clear cache and reinstall

## 🔧 Solutions Based on Logs

### **If nodemailer is not found:**

**Option A: Manual Deployment Trigger**
1. Go to Render Dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. This forces a fresh npm install

**Option B: Add to Render Environment**
1. Go to Environment tab
2. Add: `NPM_CONFIG_LOGLEVEL=verbose`
3. Redeploy to see detailed npm install logs

### **If nodemailer loads but createTransporter is missing:**

This suggests a version mismatch or corrupted cache.

**Solution:**
1. In Render Dashboard → Settings
2. Scroll to "Build Command"
3. Change from default to: `cd server && npm ci && npm list nodemailer`
4. Save and redeploy

### **If everything looks correct in logs but still fails:**

**Check Node Version:**
1. In Render logs, look for Node version
2. Nodemailer 7.x requires Node 14+
3. If Node version is old, update in render.yaml or dashboard

## 📋 What to Send Me

After the deployment completes (1-3 minutes), please copy and paste:

1. **The nodemailer loading logs** (lines with 📦 or ✅/❌ about nodemailer)
2. **Any error messages** from the email service initialization
3. **The response** from `/api/email-test/verify` endpoint

Example of what to copy:
```
✅ Nodemailer loaded successfully
📦 Module info: { type: 'object', hasCreateTransporter: 'function', isFunction: true }
🔧 Creating email transporter...
✅ Transporter created successfully
```

## 🚀 Quick Test After Deployment

Once deployed, test immediately:

```bash
curl https://mentourme-v2.onrender.com/api/email-test/verify
```

Or open in browser:
```
https://mentourme-v2.onrender.com/api/email-test/verify
```

## 💡 Alternative: Force Clean Install

If all else fails, we can force a completely clean install:

1. Create a new file: `server/.npmrc`
```
package-lock=false
```

2. Update build command to:
```
cd server && rm -rf node_modules package-lock.json && npm install && npm list nodemailer
```

3. This forces a fresh install every time

---

**Wait 2-3 minutes for deployment, then check the logs and test the endpoint!**
