#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * Verifies that all necessary files are present for successful deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 MentourMe Deployment Verification\n');

const checks = [
  {
    name: 'Root package-lock.json',
    path: './package-lock.json',
    required: true
  },
  {
    name: 'Client package-lock.json',
    path: './client/package-lock.json',
    required: true
  },
  {
    name: 'Server package-lock.json',
    path: './server/package-lock.json',
    required: true
  },
  {
    name: 'Client package.json',
    path: './client/package.json',
    required: true
  },
  {
    name: 'Client wrangler.toml',
    path: './client/wrangler.toml',
    required: true
  },
  {
    name: 'Client .env.production',
    path: './client/.env.production',
    required: true
  },
  {
    name: 'Server render.yaml',
    path: './server/render.yaml',
    required: true
  }
];

let allPassed = true;

console.log('📋 File Verification:');
console.log('─'.repeat(50));

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
  const message = exists ? 'EXISTS' : (check.required ? 'MISSING (REQUIRED)' : 'MISSING (OPTIONAL)');
  
  console.log(`${status} ${check.name.padEnd(25)} ${message}`);
  
  if (check.required && !exists) {
    allPassed = false;
  }
});

console.log('\n📊 Configuration Verification:');
console.log('─'.repeat(50));

// Check client wrangler.toml configuration
if (fs.existsSync('./client/wrangler.toml')) {
  const wranglerContent = fs.readFileSync('./client/wrangler.toml', 'utf8');
  
  if (wranglerContent.includes('mentourme-v2.onrender.com')) {
    console.log('✅ Wrangler.toml has correct backend URL');
  } else {
    console.log('❌ Wrangler.toml has incorrect backend URL');
    allPassed = false;
  }
  
  if (wranglerContent.includes('pages_build_output_dir = "dist"')) {
    console.log('✅ Wrangler.toml has correct build output directory');
  } else {
    console.log('❌ Wrangler.toml missing or incorrect build output directory');
    allPassed = false;
  }
} else {
  console.log('❌ Wrangler.toml file missing');
  allPassed = false;
}

// Check client .env.production
if (fs.existsSync('./client/.env.production')) {
  const envContent = fs.readFileSync('./client/.env.production', 'utf8');
  
  if (envContent.includes('mentourme-v2.onrender.com')) {
    console.log('✅ Client .env.production has correct API URL');
  } else {
    console.log('❌ Client .env.production has incorrect API URL');
    allPassed = false;
  }
} else {
  console.log('❌ Client .env.production file missing');
  allPassed = false;
}

console.log('\n🔐 Security Verification:');
console.log('─'.repeat(50));

// Check for exposed secrets
const sensitivePatterns = [
  'xkeysib-',
  'sk-',
  'pk_',
  'Bearer ',
  'password=',
  'secret='
];

let secretsFound = false;
const filesToCheck = ['./client/.env.production', './server/.env.example'];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    sensitivePatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        console.log(`⚠️ Potential secret found in ${filePath}: ${pattern}*`);
        secretsFound = true;
      }
    });
  }
});

if (!secretsFound) {
  console.log('✅ No exposed secrets detected in tracked files');
}

console.log('\n📈 Deployment Readiness:');
console.log('─'.repeat(50));

if (allPassed && !secretsFound) {
  console.log('🎉 ALL CHECKS PASSED - Ready for deployment!');
  console.log('\n🚀 Next Steps:');
  console.log('1. Push to GitHub (git push origin main)');
  console.log('2. Trigger Cloudflare Pages deployment');
  console.log('3. Configure Render environment variables');
  console.log('4. Test user registration and login');
} else {
  console.log('❌ DEPLOYMENT NOT READY - Please fix the issues above');
  process.exit(1);
}

console.log('\n📝 Current Git Status:');
console.log('─'.repeat(50));

const { execSync } = require('child_process');

try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('⚠️ Uncommitted changes detected:');
    console.log(gitStatus);
  } else {
    console.log('✅ Working directory clean');
  }
  
  const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  console.log(`📍 Current commit: ${currentCommit.substring(0, 7)}`);
  
} catch (error) {
  console.log('⚠️ Could not check git status');
}
