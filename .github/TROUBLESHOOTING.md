# GitHub Actions Troubleshooting Guide

This guide helps you troubleshoot common issues with the MentourMe GitHub Actions workflows.

## Quick Diagnostics

### Check Workflow Status
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Look for failed workflows (red ❌) or successful ones (green ✅)
4. Click on a workflow run to see detailed logs

### Status Badges
The README.md includes status badges that show the current state of your workflows:
- ![Deploy to Production](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/deploy.yml/badge.svg)
- ![Scheduled Tasks](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/scheduled-tasks.yml/badge.svg)

## Common Issues and Solutions

### 1. Test Failures

**Problem**: Tests fail during deployment
```
npm test
Error: no test specified
exit status 1
```

**Solution**: ✅ **FIXED** - Updated package.json test scripts to use Jest properly

### 2. Missing Secrets

**Problem**: Workflow fails with secret-related errors
```
⚠️ Required secrets not configured
```

**Solution**: Configure the following secrets in GitHub:
- `RENDER_DEPLOY_HOOK`
- `VITE_API_URL`
- `VITE_WS_URL`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BACKEND_URL`
- `FRONTEND_URL`
- `ADMIN_API_TOKEN`

See [GITHUB_SECRETS.md](../GITHUB_SECRETS.md) for detailed setup instructions.

### 3. Dependency Installation Issues

**Problem**: npm ci fails
```
npm ERR! cipm can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync
```

**Solution**: ✅ **FIXED** - Updated .gitignore to include package-lock.json files

### 4. Build Failures

**Problem**: Frontend build fails
```
npm run build
Error: Environment variables not set
```

**Solution**: Ensure all required environment variables are set in workflow:
- `VITE_API_URL`
- `VITE_WS_URL`

### 5. Deployment Hook Failures

**Problem**: Render deployment fails
```
❌ Render deployment failed
```

**Solutions**:
1. Check if `RENDER_DEPLOY_HOOK` secret is correctly set
2. Verify the webhook URL is active in Render dashboard
3. Check Render service logs for deployment errors

### 6. API Endpoint Issues

**Problem**: Scheduled tasks fail with HTTP errors
```
❌ Failed to send session reminders (HTTP 404)
```

**Solutions**:
1. Verify `BACKEND_URL` points to correct production URL
2. Check if the API endpoints exist and are accessible
3. Validate `ADMIN_API_TOKEN` is correct and not expired

## Workflow-Specific Troubleshooting

### Deploy Workflow (deploy.yml)

**Backend Deployment Issues**:
- Check server tests pass locally: `cd server && npm test`
- Verify Render service is running
- Check environment variables in Render dashboard

**Frontend Deployment Issues**:
- Check client tests pass locally: `cd client && npm test`
- Verify Cloudflare Pages project exists
- Check build output in workflow logs

### Scheduled Tasks Workflow (scheduled-tasks.yml)

**Session Reminders Issues**:
- Verify `/api/admin/tasks/session-reminders` endpoint exists
- Check admin token permissions
- Validate cron schedule syntax

**Health Check Issues**:
- Ensure `/health` endpoint returns 200 status
- Check if services are actually running
- Verify URLs don't have trailing slashes

## Manual Testing

### Test Workflows Locally

1. **Test Server**:
```bash
cd server
npm install
npm test
npm start
```

2. **Test Client**:
```bash
cd client
npm install
npm test
npm run build
```

### Test API Endpoints

```bash
# Health check
curl -f "https://your-backend.onrender.com/health"

# Admin endpoints (replace with your token)
curl -X POST "https://your-backend.onrender.com/api/admin/tasks/session-reminders" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Getting Help

### Workflow Logs
1. Go to Actions tab in GitHub
2. Click on failed workflow
3. Expand failed steps to see detailed error messages
4. Look for specific error codes and messages

### Debug Mode
Add this to your workflow for more verbose output:
```yaml
- name: Debug Info
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    ls -la
```

### Contact Support
If issues persist:
1. Check GitHub Actions status page
2. Review Render/Cloudflare service status
3. Verify all external services are operational
4. Create an issue with workflow logs and error messages

## Best Practices

1. **Test Locally First**: Always test changes locally before pushing
2. **Use Staging Environment**: Test deployments in staging before production
3. **Monitor Logs**: Regularly check workflow logs for warnings
4. **Keep Secrets Updated**: Rotate API tokens and keys regularly
5. **Version Lock Dependencies**: Use package-lock.json for consistent builds
