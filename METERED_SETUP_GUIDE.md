# 🎥 Metered WebRTC Setup Guide for MentourMe

## Overview
Metered provides TURN/STUN servers for reliable WebRTC video calling, especially when users are behind NATs or firewalls.

## Step-by-Step Setup

### 1. Create Metered Account

1. **Visit**: https://www.metered.ca/
2. **Click**: "Sign Up" (top right corner)
3. **Choose Plan**: 
   - **Free Plan**: 50GB/month (good for testing)
   - **Starter Plan**: $29/month for 500GB
4. **Complete Registration**: Fill out form and verify email

### 2. Access Your Dashboard

1. **Login** to https://dashboard.metered.ca/
2. **Navigate** to "Live Video Calling" section
3. **Create App** or use the default application

### 3. Get Your Credentials

#### 🔑 API Keys
**Location**: Dashboard → Settings → API Keys

```
API Key: met_prod_xxxxxxxxxxxxxxxxxx
Secret Key: met_secret_xxxxxxxxxxxxxxxxxx
```

#### 🌐 Domain
**Location**: Dashboard → Settings → Domain

```
Domain: yourappname.metered.live
```

#### 👤 Username
**Location**: Dashboard → Settings → Username

```
Username: your_chosen_username
```

### 4. Configure MentourMe

#### A. Frontend Configuration (Cloudflare Pages)

Update your **Cloudflare Pages environment variables**:

```env
# WebRTC Configuration
VITE_METERED_API_KEY=met_prod_your_api_key_here
VITE_METERED_SECRET_KEY=met_secret_your_secret_key_here
VITE_METERED_DOMAIN=yourapp.metered.live
VITE_METERED_USERNAME=your_username
```

**How to add in Cloudflare:**
1. Go to Cloudflare Pages dashboard
2. Select your MentourMe project
3. Go to Settings → Environment Variables
4. Add each variable for "Production" environment

#### B. Backend Configuration (Render)

Update your **Render environment variables**:

```env
# WebRTC Configuration
METERED_API_KEY=met_prod_your_api_key_here
METERED_SECRET_KEY=met_secret_your_secret_key_here
METERED_DOMAIN=yourapp.metered.live
METERED_USERNAME=your_username
```

**How to add in Render:**
1. Go to Render dashboard
2. Select your MentourMe backend service
3. Go to Environment tab
4. Add each variable

### 5. Test Your Setup

#### Quick Test URLs:
```bash
# Test STUN server
curl -v stun:stun.relay.metered.ca:80

# Test TURN server (requires credentials)
curl -v turn:global.relay.metered.ca:80
```

#### In-App Testing:
1. **Deploy** your updated configuration
2. **Start a video call** in MentourMe
3. **Check browser console** for WebRTC connection logs
4. **Test with different networks** (mobile data vs WiFi)

### 6. Monitor Usage

#### Metered Dashboard:
- **Usage Stats**: Dashboard → Analytics
- **Connection Logs**: Dashboard → Logs
- **Billing**: Dashboard → Billing

#### Expected Usage:
- **1-on-1 video call**: ~10-50MB per hour
- **Group calls**: ~50-200MB per hour per participant
- **Screen sharing**: Additional 20-100MB per hour

### 7. Troubleshooting

#### Common Issues:

**❌ "ICE connection failed"**
- Check API credentials are correct
- Verify TURN server authentication
- Test with different networks

**❌ "No video/audio"**
- Check browser permissions
- Verify STUN/TURN server connectivity
- Test with different browsers

**❌ "Connection timeout"**
- Check firewall settings
- Verify Metered service status
- Test TURN server credentials

#### Debug Commands:
```javascript
// In browser console during video call
console.log('ICE connection state:', peerConnection.iceConnectionState);
console.log('ICE gathering state:', peerConnection.iceGatheringState);
```

### 8. Production Optimization

#### Recommended Settings:
```env
# Optimize for your region
VITE_STUN_SERVER=stun:stun.relay.metered.ca:80
VITE_TURN_SERVER=turn:global.relay.metered.ca:80
VITE_TURN_SERVER_TCP=turn:global.relay.metered.ca:80?transport=tcp
VITE_TURNS_SERVER=turns:global.relay.metered.ca:443?transport=tcp
```

#### Cost Optimization:
- **Monitor usage** regularly
- **Set usage alerts** in Metered dashboard
- **Use STUN first**, TURN as fallback
- **Implement connection quality monitoring**

## Security Notes

⚠️ **Important**: 
- Never commit real API keys to git
- Use environment variables only
- Rotate keys periodically
- Monitor for unusual usage patterns

## Support

- **Metered Support**: https://www.metered.ca/docs/
- **WebRTC Troubleshooting**: https://webrtc.org/getting-started/
- **MentourMe Issues**: Check browser console and network tab

---

**Next Steps**: 
1. Get your Metered credentials
2. Add them to Cloudflare Pages and Render
3. Test video calling functionality
4. Monitor usage and performance
