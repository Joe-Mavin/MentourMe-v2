# 🧪 Quick Start: Test Your Brevo Email Configuration

## **Option 1: Use the HTML Test Page (Easiest)**

1. **Open** `EMAIL_TEST.html` in your browser (just double-click it)
2. **Enter** your Render backend URL (e.g., `https://mentourme-v2.onrender.com`)
3. **Click** "Verify Brevo Configuration" button
4. **If successful**, enter your email and click "Send Test Email"
5. **Check your inbox** for the test email

---

## **Option 2: Use cURL (Command Line)**

### **Step 1: Verify Configuration**
```bash
curl https://mentourme-v2.onrender.com/api/email-test/verify
```

### **Step 2: Send Test Email**
```bash
curl -X POST https://mentourme-v2.onrender.com/api/email-test/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

---

## **Option 3: Use Browser (Direct)**

### **Step 1: Verify Configuration**
Open in browser:
```
https://mentourme-v2.onrender.com/api/email-test/verify
```

You should see JSON response with configuration status.

---

## **What to Look For**

### **✅ Success Response (Verification):**
```json
{
  "success": true,
  "message": "Brevo email service is properly configured and connected!",
  "config": {
    "smtpHost": "smtp-relay.brevo.com",
    "smtpPort": 587,
    "hasUser": true,
    "hasPassword": true,
    "hasClientUrl": true
  }
}
```

### **✅ Success Response (Test Email):**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "messageId": "<unique-id@smtp-relay.brevo.com>",
  "recipient": "your-email@example.com"
}
```

### **❌ Common Errors:**

**1. Invalid Credentials:**
```json
{
  "success": false,
  "message": "Email configuration test failed",
  "error": "Invalid login or password",
  "details": "EAUTH"
}
```
**Fix**: Check your `BREVO_SMTP_USER` and `BREVO_SMTP_PASSWORD` in Render

**2. Missing Environment Variables:**
```json
{
  "success": false,
  "config": {
    "hasUser": false,
    "hasPassword": false
  }
}
```
**Fix**: Add the required environment variables in Render

---

## **After Successful Testing**

Once both tests pass:
1. ✅ Your Brevo configuration is correct
2. ✅ Emails can be sent from your backend
3. ✅ Ready to implement all email features:
   - Password reset emails
   - Mentor approval notifications
   - Task assignment notifications
   - Session reminders
   - And more!

---

## **Need Help?**

Check `BREVO_EMAIL_SETUP.md` for:
- Detailed troubleshooting
- How to get Brevo credentials
- Common issues and solutions
- Security best practices

---

**Let's verify your configuration now! 🚀**
