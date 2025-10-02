#!/usr/bin/env node

/**
 * Production Setup Script for MentourMe
 * Helps configure environment variables and validate deployment settings
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}`)
};

// Generate secure random string
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Check if environment variable is set
function checkEnvVar(name, value, required = true) {
  if (!value || value.trim() === '') {
    if (required) {
      log.error(`Missing required environment variable: ${name}`);
      return false;
    } else {
      log.warning(`Optional environment variable not set: ${name}`);
      return true;
    }
  }
  log.success(`${name} is configured`);
  return true;
}

// Validate database connection string
function validateDatabaseUrl(url) {
  if (!url) return false;
  
  const dbUrlPattern = /^mysql:\/\/[\w\-\.]+:[\w\-\.]+@[\w\-\.]+:\d+\/[\w\-\.]+$/;
  return dbUrlPattern.test(url);
}

// Main setup function
async function setupProduction() {
  log.title('MentourMe Production Setup');
  console.log('This script will help you configure your production environment.\n');

  const envFile = path.join(__dirname, '../server/.env.production');
  const envExampleFile = path.join(__dirname, '../server/.env.production.example');

  // Check if example file exists
  if (!fs.existsSync(envExampleFile)) {
    log.error('Environment example file not found');
    process.exit(1);
  }

  // Read example file
  const envExample = fs.readFileSync(envExampleFile, 'utf8');
  let envContent = envExample;

  log.info('Generating secure keys...');
  
  // Generate JWT secret
  const jwtSecret = generateSecureKey(32);
  envContent = envContent.replace('your_super_secure_jwt_secret_key_here', jwtSecret);
  
  // Generate session secret
  const sessionSecret = generateSecureKey(32);
  envContent = envContent.replace('your_super_secure_session_secret_here', sessionSecret);
  
  // Generate admin API token
  const adminToken = generateSecureKey(16);
  envContent = envContent.replace('your_admin_api_token_for_scheduled_tasks', adminToken);

  log.success('Secure keys generated');

  // Write to production env file
  fs.writeFileSync(envFile, envContent);
  log.success('Production environment file created');

  console.log('\n📋 Next Steps:');
  console.log('1. Edit server/.env.production with your actual service credentials:');
  console.log('   - Railway database credentials');
  console.log('   - Mailgun API key and domain');
  console.log('   - Metered WebRTC credentials');
  console.log('   - Your frontend URL');
  console.log('');
  console.log('2. Copy these environment variables to your Render dashboard:');
  console.log(`   JWT_SECRET=${jwtSecret}`);
  console.log(`   SESSION_SECRET=${sessionSecret}`);
  console.log(`   ADMIN_API_TOKEN=${adminToken}`);
  console.log('');
  console.log('3. Add the ADMIN_API_TOKEN to your GitHub repository secrets');
  console.log('');
  
  log.warning('Keep these secrets secure and never commit them to your repository!');
}

// Validate production environment
function validateProduction() {
  log.title('Validating Production Environment');
  
  const envFile = path.join(__dirname, '../server/.env.production');
  
  if (!fs.existsSync(envFile)) {
    log.error('Production environment file not found. Run setup first.');
    process.exit(1);
  }

  // Read environment file
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  let isValid = true;

  // Validate required variables
  isValid &= checkEnvVar('NODE_ENV', envVars.NODE_ENV);
  isValid &= checkEnvVar('PORT', envVars.PORT);
  isValid &= checkEnvVar('DB_HOST', envVars.DB_HOST);
  isValid &= checkEnvVar('DB_USER', envVars.DB_USER);
  isValid &= checkEnvVar('DB_PASSWORD', envVars.DB_PASSWORD);
  isValid &= checkEnvVar('DB_NAME', envVars.DB_NAME);
  isValid &= checkEnvVar('JWT_SECRET', envVars.JWT_SECRET);
  isValid &= checkEnvVar('SESSION_SECRET', envVars.SESSION_SECRET);
  isValid &= checkEnvVar('CLIENT_URL', envVars.CLIENT_URL);

  // Validate URLs
  if (envVars.CLIENT_URL && !isValidUrl(envVars.CLIENT_URL)) {
    log.error('CLIENT_URL is not a valid URL');
    isValid = false;
  }

  // Validate database URL
  if (envVars.DATABASE_URL && !validateDatabaseUrl(envVars.DATABASE_URL)) {
    log.error('DATABASE_URL format is invalid');
    isValid = false;
  }

  // Check optional but recommended variables
  checkEnvVar('MAILGUN_API_KEY', envVars.MAILGUN_API_KEY, false);
  checkEnvVar('METERED_API_KEY', envVars.METERED_API_KEY, false);
  checkEnvVar('ADMIN_API_TOKEN', envVars.ADMIN_API_TOKEN, false);

  if (isValid) {
    log.success('Production environment validation passed!');
    console.log('\n🎯 Your environment is ready for deployment');
  } else {
    log.error('Production environment validation failed');
    console.log('\n🔧 Please fix the issues above before deploying');
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupProduction();
    break;
  case 'validate':
    validateProduction();
    break;
  default:
    console.log('Usage: node setup-production.js [setup|validate]');
    console.log('');
    console.log('Commands:');
    console.log('  setup    - Generate production environment file with secure keys');
    console.log('  validate - Validate production environment configuration');
    process.exit(1);
}
