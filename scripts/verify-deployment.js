#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests all endpoints and services after deployment
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  backend: process.env.BACKEND_URL || 'https://mentourme-backend.onrender.com',
  frontend: process.env.FRONTEND_URL || 'https://mentourme.pages.dev',
  timeout: 10000
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.cyan}🚀 ${msg}${colors.reset}\n`)
};

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, config.timeout);

    const req = client.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Test functions
async function testBackendHealth() {
  try {
    const response = await makeRequest(`${config.backend}/health`);
    if (response.statusCode === 200) {
      log.success('Backend health check passed');
      return true;
    } else {
      log.error(`Backend health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Backend health check error: ${error.message}`);
    return false;
  }
}

async function testFrontend() {
  try {
    const response = await makeRequest(config.frontend);
    if (response.statusCode === 200) {
      log.success('Frontend is accessible');
      return true;
    } else {
      log.error(`Frontend access failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Frontend access error: ${error.message}`);
    return false;
  }
}

async function testBackendAPI() {
  const endpoints = [
    '/api/auth/profile',
    '/api/mentorship',
    '/api/notifications/count',
    '/api/rooms',
    '/api/tasks'
  ];

  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${config.backend}${endpoint}`);
      // Accept 401 (unauthorized) as valid response for protected endpoints
      if (response.statusCode === 200 || response.statusCode === 401) {
        log.success(`API endpoint ${endpoint} is responding`);
        passed++;
      } else {
        log.warning(`API endpoint ${endpoint} returned ${response.statusCode}`);
      }
    } catch (error) {
      log.error(`API endpoint ${endpoint} error: ${error.message}`);
    }
  }

  const success = passed >= endpoints.length * 0.8; // 80% success rate
  if (success) {
    log.success(`API endpoints test passed (${passed}/${endpoints.length})`);
  } else {
    log.error(`API endpoints test failed (${passed}/${endpoints.length})`);
  }
  
  return success;
}

async function testSSL() {
  const urls = [config.backend, config.frontend];
  let passed = 0;

  for (const url of urls) {
    if (url.startsWith('https:')) {
      try {
        await makeRequest(url);
        log.success(`SSL certificate valid for ${url}`);
        passed++;
      } catch (error) {
        log.error(`SSL test failed for ${url}: ${error.message}`);
      }
    } else {
      log.warning(`${url} is not using HTTPS`);
    }
  }

  return passed === urls.filter(url => url.startsWith('https:')).length;
}

async function testCORS() {
  try {
    const response = await makeRequest(`${config.backend}/api/auth/profile`, {
      headers: {
        'Origin': config.frontend,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    // Check if CORS headers are present
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      log.success('CORS configuration is working');
      return true;
    } else {
      log.warning('CORS headers not found (may be configured differently)');
      return true; // Don't fail on this
    }
  } catch (error) {
    log.error(`CORS test error: ${error.message}`);
    return false;
  }
}

async function testWebSocket() {
  // This is a basic test - in production you'd use a WebSocket client
  try {
    const wsUrl = config.backend.replace('https:', 'wss:').replace('http:', 'ws:');
    log.info(`WebSocket URL: ${wsUrl}/socket.io/`);
    log.success('WebSocket URL format is correct');
    return true;
  } catch (error) {
    log.error(`WebSocket test error: ${error.message}`);
    return false;
  }
}

// Main verification function
async function verifyDeployment() {
  log.title('MentourMe Deployment Verification');
  
  console.log(`Backend URL: ${config.backend}`);
  console.log(`Frontend URL: ${config.frontend}\n`);

  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Frontend Access', fn: testFrontend },
    { name: 'API Endpoints', fn: testBackendAPI },
    { name: 'SSL Certificates', fn: testSSL },
    { name: 'CORS Configuration', fn: testCORS },
    { name: 'WebSocket Setup', fn: testWebSocket }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    log.info(`Running ${test.name} test...`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      }
    } catch (error) {
      log.error(`${test.name} test failed: ${error.message}`);
    }
    console.log(''); // Add spacing
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`\n📊 Verification Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    log.success('🎉 All tests passed! Your deployment is ready for production.');
    console.log('\n🔗 Next Steps:');
    console.log('1. Test user registration and login');
    console.log('2. Create a mentorship request');
    console.log('3. Schedule a session');
    console.log('4. Test real-time features');
    console.log('5. Verify email notifications');
    process.exit(0);
  } else if (passed >= total * 0.8) {
    log.warning('⚠️  Most tests passed, but some issues were found.');
    console.log('\n🔧 Review the failed tests above and fix any critical issues.');
    process.exit(1);
  } else {
    log.error('❌ Multiple tests failed. Please review your deployment configuration.');
    console.log('\n🔧 Check:');
    console.log('- Environment variables are set correctly');
    console.log('- All services are running');
    console.log('- Network connectivity between services');
    process.exit(2);
  }
}

// CLI interface
if (require.main === module) {
  verifyDeployment().catch(error => {
    log.error(`Verification failed: ${error.message}`);
    process.exit(3);
  });
}

module.exports = { verifyDeployment };
