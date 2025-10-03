import { webrtcAPI } from './api';

/**
 * WebRTC Configuration Service
 * Securely fetches WebRTC configuration from backend
 */
class WebRTCConfigService {
  constructor() {
    this.config = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get WebRTC configuration from backend
   * Includes caching to avoid repeated API calls
   */
  async getConfig() {
    try {
      // Check if we have cached config that's still valid
      if (this.config && this.lastFetch && 
          (Date.now() - this.lastFetch < this.cacheTimeout)) {
        console.log('🔄 Using cached WebRTC config');
        return this.config;
      }

      console.log('🌐 Fetching WebRTC config from backend...');
      const response = await webrtcAPI.getConfig();
      
      if (response.data.success) {
        this.config = response.data.data;
        this.lastFetch = Date.now();
        
        console.log('✅ WebRTC config loaded successfully');
        console.log('📊 ICE Servers:', this.config.webrtcConfig.iceServers.length);
        
        return this.config;
      } else {
        throw new Error(response.data.message || 'Failed to get WebRTC config');
      }
    } catch (error) {
      console.error('❌ Failed to get WebRTC config:', error);
      
      // Fallback to basic STUN servers if backend fails
      const fallbackConfig = {
        webrtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        },
        hasValidCredentials: false,
        fallback: true
      };
      
      console.log('⚠️ Using fallback STUN-only configuration');
      return fallbackConfig;
    }
  }

  /**
   * Get just the WebRTC peer connection configuration
   */
  async getPeerConnectionConfig() {
    const config = await this.getConfig();
    return config.webrtcConfig;
  }

  /**
   * Test WebRTC service availability
   */
  async testService() {
    try {
      const response = await webrtcAPI.test();
      return response.data;
    } catch (error) {
      console.error('WebRTC service test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cached configuration (force refresh on next request)
   */
  clearCache() {
    this.config = null;
    this.lastFetch = null;
    console.log('🗑️ WebRTC config cache cleared');
  }

  /**
   * Check if we have valid TURN server credentials
   */
  async hasTurnCredentials() {
    const config = await this.getConfig();
    return config.hasValidCredentials && !config.fallback;
  }

  /**
   * Get connection quality info
   */
  async getConnectionInfo() {
    const config = await this.getConfig();
    const hasTurn = await this.hasTurnCredentials();
    
    return {
      stunServers: config.webrtcConfig.iceServers.filter(server => 
        server.urls.some(url => url.startsWith('stun:'))
      ).length,
      turnServers: config.webrtcConfig.iceServers.filter(server => 
        server.urls.some(url => url.startsWith('turn:'))
      ).length,
      hasTurnCredentials: hasTurn,
      usingFallback: config.fallback || false,
      lastUpdated: this.lastFetch ? new Date(this.lastFetch).toISOString() : null
    };
  }
}

// Create singleton instance
const webrtcConfigService = new WebRTCConfigService();

export default webrtcConfigService;
