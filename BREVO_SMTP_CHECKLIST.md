# 🔍 Brevo SMTP Connection Troubleshooting

## 📊 Current Status

✅ **Code is working** - Transporter created successfully  
✅ **Environment variables are set** - All credentials present  
❌ **Connection timeout** - Cannot reach Brevo SMTP server  

**Error:** `ETIMEDOUT` - Connection timeout to `smtp-relay.brevo.com`

---

## 🎯 Quick Fixes to Try

### **Fix 1: Use Port 465 with SSL (Recommended)**

I've updated the code to use port 465 by default, which is more reliable on cloud platforms like Render.

**What changed:**
- Port: 587 → **465**
- Security: TLS → **SSL**
- Added connection timeouts for better error handling

---

### **Fix 2: Verify Your Brevo SMTP Credentials**

#### **Step 1: Log into Brevo**
Go to https://app.brevo.com

#### **Step 2: Get SMTP Credentials**
1. Click on your profile (top right)
2. Go to **"SMTP & API"**
3. Under **"SMTP"** section, you'll see:
   - **SMTP Server:** `smtp-relay.brevo.com` ✅
   - **Port:** `465` or `587` ✅
   - **Login:** Your Brevo account email
   - **SMTP Key:** A long string (NOT your regular password!)

#### **Step 3: Generate New SMTP Key**
If you're unsure about your SMTP key:
1. In the SMTP & API page
2. Click **"Generate a new SMTP key"**
3. Copy the new key
4. Update in Render environment variables

#### **Step 4: Update Render Environment Variables**

Go to Render Dashboard → Your Service → Environment

Make sure you have:
```
BREVO_SMTP_USER=your-brevo-account-email@domain.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-key (NOT regular password!)
BREVO_SMTP_PORT=465 (optional, defaults to 465 now)
CLIENT_URL=https://mentourme-v3.pages.dev
```

**Important:** `BREVO_SMTP_PASSWORD` must be your **SMTP KEY**, not your Brevo login password!

---

### **Fix 3: Check if Render Blocks SMTP**

Some cloud platforms block outbound SMTP connections by default.

**Test Alternative Ports:**

Add this to Render environment variables:
```
BREVO_SMTP_PORT=2525
```

Then redeploy. Port 2525 is an alternative SMTP port that's less likely to be blocked.

**Available Ports:**
- **465** - SSL (Recommended for Render)
- **587** - TLS (Standard but may be blocked)
- **2525** - Alternative (Fallback option)

---

### **Fix 4: Contact Render Support**

If none of the above work, Render might be blocking outbound SMTP.

**Questions to ask Render:**
1. "Does Render block outbound SMTP connections?"
2. "Are ports 465, 587, or 2525 accessible from my service?"
3. "Do I need to whitelist smtp-relay.brevo.com?"

---

## 🧪 Testing After Changes

### **Method 1: Test with Different Port**

**In Render Dashboard:**
1. Add environment variable: `BREVO_SMTP_PORT=2525`
2. Save and redeploy
3. Wait 2-3 minutes
4. Test: `https://mentourme-v2.onrender.com/api/email-test/verify`

### **Method 2: Test with New SMTP Key**

**After regenerating SMTP key in Brevo:**
1. Update `BREVO_SMTP_PASSWORD` in Render
2. Save and redeploy
3. Wait 2-3 minutes
4. Test the verify endpoint

---

## 📋 Common SMTP Errors Explained

### **ETIMEDOUT - Connection Timeout**
**Cause:** Cannot reach SMTP server  
**Solutions:**
- Try different port (465, 587, 2525)
- Check if Render blocks SMTP
- Verify Brevo SMTP server is accessible

### **EAUTH - Authentication Failed**
**Cause:** Wrong credentials  
**Solutions:**
- Regenerate SMTP key in Brevo
- Make sure using SMTP key, not regular password
- Verify email address matches Brevo account

### **ECONNREFUSED - Connection Refused**
**Cause:** SMTP server rejecting connection  
**Solutions:**
- Check if Brevo account is active
- Verify SMTP is enabled in Brevo settings
- Try different port

---

## ✅ What to Check Right Now

**Before redeploying, verify:**

1. **Brevo Account Status**
   - [ ] Account is active
   - [ ] Email verified
   - [ ] SMTP is enabled

2. **SMTP Credentials**
   - [ ] Using SMTP key (not regular password)
   - [ ] Email matches Brevo account
   - [ ] Key is recently generated (not expired)

3. **Render Configuration**
   - [ ] `BREVO_SMTP_USER` is set correctly
   - [ ] `BREVO_SMTP_PASSWORD` is the SMTP key
   - [ ] Try adding `BREVO_SMTP_PORT=465` explicitly

---

## 🚀 Next Steps

**Option A: Deploy with Port 465 (Current)**
The code now defaults to port 465. Just wait for current deployment to finish and test.

**Option B: Try Port 2525**
Add `BREVO_SMTP_PORT=2525` in Render environment and redeploy.

**Option C: Regenerate Credentials**
1. Generate new SMTP key in Brevo
2. Update `BREVO_SMTP_PASSWORD` in Render
3. Redeploy and test

---

**Current deployment uses port 465. Wait 2-3 minutes and test again!**
