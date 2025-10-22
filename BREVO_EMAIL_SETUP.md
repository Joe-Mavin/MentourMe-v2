# Brevo Email Configuration Guide

## 🔍 **Step 1: Verify Brevo Configuration**

### **Required Environment Variables on Render:**

Make sure these are set in your Render backend environment:

```
BREVO_SMTP_USER=your-brevo-smtp-login@email.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-password-or-api-key
CLIENT_URL=https://your-frontend-url.com
```

### **How to Get Brevo SMTP Credentials:**

1. **Log in to Brevo** (https://app.brevo.com)
2. **Go to**: Settings → SMTP & API
3. **SMTP Settings**:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your Brevo account email (e.g., `your-email@domain.com`)
   - **SMTP Key**: Generate a new SMTP key if you don't have one

---

## 🧪 **Step 2: Test Your Configuration**

### **Method 1: Verify Connection (No Email Sent)**

**Endpoint**: `GET /api/email-test/verify`

**Using cURL:**
```bash
curl https://your-backend-url.onrender.com/api/email-test/verify
```

**Using Browser:**
```
https://your-backend-url.onrender.com/api/email-test/verify
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Brevo email service is properly configured and connected!",
  "config": {
    "smtpHost": "smtp-relay.brevo.com",
    "smtpPort": 587,
    "hasUser": true,
    "hasPassword": true,
    "hasClientUrl": true,
    "userEmail": "you***"
  }
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Email configuration test failed",
  "error": "Invalid login or password",
  "details": "EAUTH"
}
```

---

### **Method 2: Send Test Email**

**Endpoint**: `POST /api/email-test/send`

**Using cURL:**
```bash
curl -X POST https://your-backend-url.onrender.com/api/email-test/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Using Postman/Thunder Client:**
- **Method**: POST
- **URL**: `https://your-backend-url.onrender.com/api/email-test/send`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "your-email@example.com"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "messageId": "<unique-message-id@smtp-relay.brevo.com>",
  "recipient": "your-email@example.com"
}
```

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: "Invalid login or password" (EAUTH)**

**Cause**: Wrong SMTP credentials

**Solution**:
1. Double-check your Brevo SMTP login (should be your Brevo account email)
2. Regenerate your SMTP key in Brevo dashboard
3. Update `BREVO_SMTP_PASSWORD` in Render with the new key
4. Restart your Render service

---

### **Issue 2: "Connection timeout" (ETIMEDOUT)**

**Cause**: Firewall or network issues

**Solution**:
1. Verify port 587 is not blocked
2. Check if Render has any network restrictions
3. Try using port 465 with SSL (update emailService.js if needed)

---

### **Issue 3: "Email service disabled - nodemailer not available"**

**Cause**: nodemailer package not installed

**Solution**:
```bash
cd server
npm install nodemailer
```

---

### **Issue 4: Environment variables not found**

**Cause**: Variables not set in Render or typo in variable names

**Solution**:
1. Go to Render Dashboard → Your Service → Environment
2. Add/verify these exact variable names:
   - `BREVO_SMTP_USER`
   - `BREVO_SMTP_PASSWORD`
   - `CLIENT_URL`
3. Click "Save Changes"
4. Render will automatically redeploy

---

## 📧 **Available Email Templates**

Once Brevo is configured, these emails will work automatically:

### **Currently Implemented:**
- ✅ **Welcome Email** - Sent on user registration
- ✅ **Password Reset** - Sent when user requests password reset
- ✅ **Session Reminder** - Sent before mentorship sessions
- ✅ **Mentor Match** - Sent when mentor-mentee connection is made
- ✅ **Newsletter Signup** - Sent when user subscribes to newsletter

### **To Be Implemented:**
- ⏳ **Mentor Approval Notification** - When admin approves mentor application
- ⏳ **Mentorship Request** - When mentee requests a mentor
- ⏳ **Task Assignment** - When mentor assigns a battle mission
- ⏳ **Task Completion** - When mentee completes a task
- ⏳ **Session Scheduled** - When a new session is booked
- ⏳ **Message Notification** - When user receives a new message
- ⏳ **Community Invite** - When invited to a battle room

---

## 🚀 **Next Steps After Verification**

Once your Brevo configuration is verified:

1. **Test the verify endpoint** to confirm connection
2. **Send a test email** to your own email address
3. **Check your inbox** (and spam folder) for the test email
4. **Confirm all environment variables** are correct
5. **Proceed to implementation** of remaining email features

---

## 📝 **Brevo Account Limits**

**Free Plan:**
- 300 emails/day
- Unlimited contacts
- Brevo logo in emails

**Lite Plan ($25/month):**
- 10,000 emails/month
- No daily limit
- Remove Brevo logo
- Better deliverability

**For Production:**
Consider upgrading to at least the Lite plan for better deliverability and professional appearance.

---

## 🔐 **Security Best Practices**

1. **Never commit** `.env` files to Git
2. **Use environment variables** for all sensitive data
3. **Rotate SMTP keys** regularly (every 3-6 months)
4. **Monitor email logs** for suspicious activity
5. **Set up SPF/DKIM** records for your domain (in Brevo settings)

---

## 📊 **Monitoring Email Delivery**

**Brevo Dashboard:**
- Go to Statistics → Email
- View delivery rates, opens, clicks
- Check bounce rates and spam reports
- Monitor daily/monthly usage

**Server Logs:**
- Check Render logs for email send confirmations
- Look for `✅ Email sent:` messages
- Monitor for `❌ Failed to send email:` errors

---

## 🆘 **Support Resources**

- **Brevo Documentation**: https://developers.brevo.com/docs
- **Brevo Support**: https://help.brevo.com
- **SMTP Troubleshooting**: https://help.brevo.com/hc/en-us/articles/209467485

---

**Ready to test? Run the verification endpoint first!**

```bash
curl https://your-backend-url.onrender.com/api/email-test/verify
```
