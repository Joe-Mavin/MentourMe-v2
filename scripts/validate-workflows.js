#!/usr/bin/env node

/**
 * GitHub Actions Workflow Validation Script
 * 
 * This script validates that your local environment is ready for GitHub Actions
 * and checks for common configuration issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 MentourMe GitHub Actions Validation\n');

const errors = [];
const warnings = [];
const success = [];

// Check if we're in the right directory
const rootDir = path.join(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${description} exists`);
    return true;
  } else {
    errors.push(`❌ ${description} missing: ${filePath}`);
    return false;
  }
}

function checkPackageJson(dir, name) {
  const packagePath = path.join(dir, 'package.json');
  const lockPath = path.join(dir, 'package-lock.json');
  
  if (checkFile(packagePath, `${name} package.json`)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check test script
      if (pkg.scripts && pkg.scripts.test) {
        if (pkg.scripts.test.includes('exit 1')) {
          errors.push(`❌ ${name} test script will fail: ${pkg.scripts.test}`);
        } else {
          success.push(`✅ ${name} test script configured`);
        }
      } else {
        warnings.push(`⚠️ ${name} missing test script`);
      }
      
      // Check build script for client
      if (name === 'Client' && pkg.scripts && pkg.scripts.build) {
        success.push(`✅ ${name} build script configured`);
      } else if (name === 'Client') {
        errors.push(`❌ ${name} missing build script`);
      }
      
    } catch (e) {
      errors.push(`❌ ${name} package.json is invalid JSON`);
    }
  }
  
  checkFile(lockPath, `${name} package-lock.json`);
}

function runTests(dir, name) {
  try {
    console.log(`\n🧪 Running ${name} tests...`);
    process.chdir(dir);
    execSync('npm test', { stdio: 'pipe' });
    success.push(`✅ ${name} tests pass`);
  } catch (error) {
    errors.push(`❌ ${name} tests fail`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
  }
}

// Main validation
console.log('📋 Checking project structure...\n');

// Check workflow files
checkFile(path.join(rootDir, '.github', 'workflows', 'deploy.yml'), 'Deploy workflow');
checkFile(path.join(rootDir, '.github', 'workflows', 'scheduled-tasks.yml'), 'Scheduled tasks workflow');

// Check documentation
checkFile(path.join(rootDir, 'GITHUB_SECRETS.md'), 'GitHub secrets documentation');
checkFile(path.join(rootDir, '.github', 'TROUBLESHOOTING.md'), 'Troubleshooting guide');

// Check package files
checkPackageJson(serverDir, 'Server');
checkPackageJson(clientDir, 'Client');

// Check essential server files
checkFile(path.join(serverDir, 'server.js'), 'Server entry point');
checkFile(path.join(serverDir, 'healthcheck.js'), 'Health check script');

// Check .gitignore
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignore.includes('package-lock.json') && !gitignore.includes('# package-lock.json')) {
    warnings.push('⚠️ .gitignore excludes package-lock.json (may cause CI issues)');
  } else {
    success.push('✅ .gitignore properly configured for CI');
  }
}

// Test installations
console.log('\n📦 Checking dependencies...\n');

try {
  process.chdir(serverDir);
  execSync('npm ls', { stdio: 'pipe' });
  success.push('✅ Server dependencies installed');
} catch (error) {
  warnings.push('⚠️ Server dependencies may have issues');
}

try {
  process.chdir(clientDir);
  execSync('npm ls', { stdio: 'pipe' });
  success.push('✅ Client dependencies installed');
} catch (error) {
  warnings.push('⚠️ Client dependencies may have issues');
}

// Run tests if requested
if (process.argv.includes('--test')) {
  runTests(serverDir, 'Server');
  runTests(clientDir, 'Client');
}

// Reset directory
process.chdir(rootDir);

// Report results
console.log('\n📊 Validation Results:\n');

if (success.length > 0) {
  console.log('✅ Success:');
  success.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️ Warnings:');
  warnings.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

// Summary
const total = success.length + warnings.length + errors.length;
console.log(`📈 Summary: ${success.length} passed, ${warnings.length} warnings, ${errors.length} errors (${total} total)\n`);

if (errors.length === 0) {
  console.log('🎉 Your project is ready for GitHub Actions!');
  console.log('💡 Next steps:');
  console.log('   1. Configure GitHub secrets (see GITHUB_SECRETS.md)');
  console.log('   2. Push to main branch to trigger deployment');
  console.log('   3. Monitor workflow status in GitHub Actions tab');
} else {
  console.log('🔧 Please fix the errors above before deploying.');
  process.exit(1);
}

console.log('\n🔗 Useful commands:');
console.log('   npm run validate-workflows --test  # Run with tests');
console.log('   cd server && npm test              # Test server only');
console.log('   cd client && npm test              # Test client only');
