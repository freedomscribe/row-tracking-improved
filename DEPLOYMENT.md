# Deployment Guide - ROW Tracking Application

This guide provides step-by-step instructions for deploying the ROW Tracking application to Vercel for production use.

## Prerequisites

Before deploying, ensure you have:

- [x] A Vercel account ([sign up here](https://vercel.com/signup))
- [x] A GitHub account with your code repository
- [x] A PostgreSQL database (Vercel Postgres, Supabase, or other)
- [x] Google OAuth credentials
- [x] Stripe account with products configured
- [x] Domain name (optional, Vercel provides free subdomain)

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ROW Tracking v2.0"
git branch -M main
git remote add origin https://github.com/yourusername/row-tracking.git
git push -u origin main
```

### 1.2 Verify Files

Ensure these files are in your repository:
- `package.json`
- `next.config.js`
- `prisma/schema.prisma`
- `.env.example` (but NOT `.env.local`)
- `.gitignore` (should exclude `.env.local`, `node_modules`, etc.)

## Step 2: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Create Postgres database:
```bash
vercel postgres create row-tracking-db
```

4. Get connection string:
```bash
vercel postgres show row-tracking-db
```

Copy the `DATABASE_URL` for later use.

### Option B: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (Transaction mode)
5. Replace `[YOUR-PASSWORD]` with your database password

### Option C: Railway

1. Go to [Railway](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from the **Connect** tab

## Step 3: Configure OAuth Providers

### 3.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: **ROW Tracking Production**
3. Enable **Google+ API**
4. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Name: **ROW Tracking**
   - Authorized redirect URIs:
     ```
     https://your-domain.vercel.app/api/auth/callback/google
     ```
5. Copy **Client ID** and **Client Secret**

### 3.2 GitHub OAuth (Optional)

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. **New OAuth App**
3. Fill in:
   - Application name: **ROW Tracking**
   - Homepage URL: `https://your-domain.vercel.app`
   - Authorization callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy **Client ID** and **Client Secret**

## Step 4: Configure Stripe

### 4.1 Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production mode** (toggle in top right)
3. Go to **Products** → **Add Product**

Create three products:

**Basic Plan:**
- Name: Basic Plan
- Price: $29.00 USD
- Billing period: Monthly
- Copy the **Price ID** (starts with `price_`)

**Pro Plan:**
- Name: Pro Plan
- Price: $99.00 USD
- Billing period: Monthly
- Copy the **Price ID**

**Enterprise Plan:**
- Name: Enterprise Plan
- Price: Custom (you can set to $299 or contact sales)
- Billing period: Monthly
- Copy the **Price ID**

### 4.2 Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

### 4.3 Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Description: ROW Tracking Subscription Events
5. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)

## Step 5: Deploy to Vercel

### 5.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

### 5.2 Add Environment Variables

In the Vercel project settings, add these environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-random-string-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Vercel Blob (will be auto-configured)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=ROW Tracking
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5.3 Deploy

Click **Deploy** and wait for the build to complete.

## Step 6: Run Database Migrations

After successful deployment:

1. Install Vercel CLI (if not already):
```bash
npm install -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Pull environment variables:
```bash
vercel env pull .env.production
```

4. Run migrations:
```bash
npx prisma migrate deploy
```

Or use Vercel's terminal:
1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Functions**
3. Use the terminal to run:
```bash
npx prisma migrate deploy
```

## Step 7: Configure Custom Domain (Optional)

### 7.1 Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `rowtracking.com`)
3. Follow DNS configuration instructions

### 7.2 Update OAuth Redirect URIs

Update redirect URIs in:
- Google Cloud Console
- GitHub OAuth settings
- Stripe webhook URL

Change from `your-domain.vercel.app` to your custom domain.

### 7.3 Update Environment Variables

Update these in Vercel:
```env
NEXTAUTH_URL=https://rowtracking.com
NEXT_PUBLIC_APP_URL=https://rowtracking.com
```

Redeploy after updating.

## Step 8: Verify Deployment

### 8.1 Test Authentication

1. Visit your deployed site
2. Click **Sign In**
3. Try Google OAuth login
4. Verify you can create an account

### 8.2 Test Subscription Flow

1. Go to **Pricing** page
2. Select a plan
3. Click **Subscribe**
4. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
5. Verify subscription is activated

### 8.3 Test Webhook

1. In Stripe Dashboard, go to **Webhooks**
2. Click on your webhook
3. Send test event: `checkout.session.completed`
4. Verify it succeeds (200 response)

### 8.4 Test Core Features

1. Create a project
2. Add parcels
3. Add notes
4. Export to CSV/PDF
5. View analytics dashboard

## Step 9: Monitoring & Maintenance

### 9.1 Set Up Monitoring

1. **Vercel Analytics**: Automatically enabled
2. **Stripe Dashboard**: Monitor subscriptions and payments
3. **Database Monitoring**: Use your database provider's dashboard

### 9.2 Regular Maintenance

- **Weekly**: Check error logs in Vercel
- **Monthly**: Review Stripe transactions
- **Quarterly**: Update dependencies
- **As needed**: Database backups

### 9.3 Backup Strategy

**Database Backups:**
- Vercel Postgres: Automatic daily backups
- Supabase: Automatic backups (check retention)
- Manual: `pg_dump` weekly

**Code Backups:**
- GitHub repository (already backed up)
- Tag releases: `git tag v2.0.0`

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Add to build command in Vercel:
prisma generate && next build
```

**Error: Environment variables not found**
- Check all required env vars are set in Vercel
- Redeploy after adding variables

### OAuth Not Working

**Error: Redirect URI mismatch**
- Verify redirect URIs in OAuth provider settings
- Must match exactly: `https://yourdomain.com/api/auth/callback/google`
- Include `/api/auth/callback/[provider]`

### Stripe Webhook Fails

**Error: Webhook signature verification failed**
- Use the webhook secret from Stripe Dashboard
- Make sure it's the production webhook secret, not test
- Verify URL is correct: `https://yourdomain.com/api/webhooks/stripe`

### Database Connection Issues

**Error: Can't reach database server**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules allow Vercel IPs

**Error: SSL required**
- Add `?sslmode=require` to DATABASE_URL
- Example: `postgresql://user:pass@host:5432/db?sslmode=require`

## Security Checklist

- [ ] All environment variables are set in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] OAuth redirect URIs are production URLs only
- [ ] Stripe is in production mode (not test mode)
- [ ] Database has strong password
- [ ] SSL/TLS is enabled for database connection
- [ ] HTTPS is enforced (automatic with Vercel)

## Performance Optimization

### 1. Enable Caching

Add to `next.config.js`:
```javascript
module.exports = {
  // ... existing config
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 2. Database Optimization

- Add indexes to frequently queried fields
- Use connection pooling
- Monitor slow queries

### 3. Image Optimization

- Use Next.js Image component
- Compress images before upload
- Use WebP format

## Cost Estimation

**Vercel:**
- Free tier: 100GB bandwidth, 100 serverless function executions
- Pro: $20/month - Unlimited bandwidth, analytics

**Database:**
- Vercel Postgres: $0.10/GB storage, $0.10/GB transfer
- Supabase: Free tier available, Pro $25/month

**Stripe:**
- 2.9% + $0.30 per transaction
- No monthly fees

**Estimated Monthly Cost:**
- Small (< 100 users): $20-50
- Medium (100-1000 users): $50-200
- Large (1000+ users): $200-500+

## Support

For deployment issues:
- Vercel: [Vercel Support](https://vercel.com/support)
- Stripe: [Stripe Support](https://support.stripe.com/)
- Database: Check your provider's documentation

---

**Congratulations! Your ROW Tracking application is now live in production! 🎉**

