# GitHub Secrets Configuration

This document lists all the required GitHub secrets for the MentourMe project's CI/CD workflows.

## Required Secrets for Deployment Workflow

### Backend Deployment
- `RENDER_DEPLOY_HOOK`: The webhook URL from Render to trigger backend deployment

### Frontend Deployment
- `VITE_API_URL`: The production API URL for the frontend (e.g., `https://your-backend.onrender.com`)
- `VITE_WS_URL`: The production WebSocket URL for real-time features (e.g., `wss://your-backend.onrender.com`)
- `CLOUDFLARE_API_TOKEN`: API token for Cloudflare Pages deployment
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions (no need to set manually)

## Required Secrets for Scheduled Tasks Workflow

### API Endpoints
- `BACKEND_URL`: The production backend URL (e.g., `https://your-backend.onrender.com`)
- `FRONTEND_URL`: The production frontend URL (e.g., `https://mentourme.pages.dev`)

### Authentication
- `ADMIN_API_TOKEN`: JWT token for admin API access to scheduled tasks

## How to Set GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its name and value

## Testing Secrets Configuration

You can test if your secrets are properly configured by:

1. **Manual Workflow Trigger**: Go to Actions tab → Select a workflow → Click "Run workflow"
2. **Check Workflow Logs**: Look for warning messages about missing secrets
3. **Health Check**: The scheduled tasks workflow includes health checks that validate your endpoints

## Security Best Practices

- Never commit secrets to your repository
- Use environment-specific secrets (separate for staging/production)
- Regularly rotate API tokens and keys
- Monitor secret usage in workflow logs
- Use least-privilege access for API tokens

## Troubleshooting

### Common Issues

1. **"Required secrets not configured"**: One or more secrets are missing or empty
2. **"HTTP 401" errors**: Invalid or expired API tokens
3. **"HTTP 404" errors**: Incorrect URLs in secrets
4. **Deployment failures**: Check Render/Cloudflare dashboard for service status

### Debug Steps

1. Check workflow logs for specific error messages
2. Verify secret names match exactly (case-sensitive)
3. Test API endpoints manually with curl
4. Validate API tokens in their respective dashboards
5. Ensure URLs don't have trailing slashes unless required

## Environment Variables vs Secrets

- **Secrets**: Sensitive data (API keys, tokens, passwords)
- **Environment Variables**: Non-sensitive configuration (feature flags, public URLs)

Use GitHub secrets for all sensitive information and environment variables for public configuration.
