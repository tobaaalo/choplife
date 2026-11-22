# Deploying Choplife from GitHub

Everything runs from GitHub Actions. You never use a terminal.

## One-time setup (in your browser)

1. In Cloudflare: profile (top right), API Tokens, Create Token, Custom token. Account permissions: Cloudflare Pages Edit, Workers Scripts Edit, D1 Edit. Copy the token.
2. Copy your Account ID from the Cloudflare dashboard (Workers and Pages page, right-hand side).
3. In the GitHub repo: Settings, Secrets and variables, Actions, New repository secret. Add:
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID
   - VAPID_PRIVATE_KEY (the reminder key Claude gave you)
   - RESEND_API_KEY (optional, from resend.com, for password reset emails)
4. Actions tab, Deploy, Run workflow.

The first run creates the database and the website project, then deploys. After that every push to main deploys automatically, and a failing check stops the deploy.

## Reminders on iPhone

Add the site to the Home Screen first (iOS 16.4 or later), then turn reminders on in Settings.
