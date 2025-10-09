# Quick Start Guide - ROW Tracking Application

This guide will help you get the ROW Tracking application up and running in production as quickly as possible.

## ⚡ 5-Minute Setup (Using Vercel)

### Step 1: Prerequisites (2 minutes)

Before you begin, make sure you have:

1. **GitHub Account** - Sign up at [github.com](https://github.com)
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Google Account** - For OAuth setup
4. **Stripe Account** - Sign up at [stripe.com](https://stripe.com) (free)

### Step 2: Push Code to GitHub (1 minute)

```bash
# Navigate to the project directory
cd row-tracking-improved

# Initialize git and push to GitHub
git init
git add .
git commit -m "Initial commit: ROW Tracking v2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/row-tracking.git
git push -u origin main
```

### Step 3: Deploy to Vercel (2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `row-tracking` repository
4. Click **Import**
5. **Don't deploy yet** - we need to add environment variables first

## 🔧 Configuration (15 minutes)

### Database Setup (5 minutes)

**Option A: Vercel Postgres (Recommended)**

1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Name it `row-tracking-db`
4. Copy the `DATABASE_URL` connection string
5. Add it to your environment variables in Vercel

**Option B: Supabase (Free Alternative)**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy **Connection String** (Transaction mode)
5. Replace `[YOUR-PASSWORD]` with your database password

### Google OAuth Setup (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: **ROW Tracking**
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Name: **ROW Tracking**
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret**

### Stripe Setup (5 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production mode** (toggle in top right)
3. Create products:
   - **Basic Plan**: $29/month
   - **Pro Plan**: $99/month
   - **Enterprise Plan**: Custom
4. Copy each **Price ID** (starts with `price_`)
5. Go to **Developers** → **API Keys**
6. Copy **Publishable key** and **Secret key**
7. Go to **Developers** → **Webhooks**
8. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
9. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
10. Copy **Signing secret**

### Add Environment Variables to Vercel

In your Vercel project settings, go to **Settings** → **Environment Variables** and add:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=run-this-command-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## 🚀 Deploy

1. Click **Deploy** in Vercel
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at `https://your-app.vercel.app`

## 🗄️ Initialize Database

After deployment, run migrations:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

## ✅ Verify Deployment

### 1. Test Authentication
- Visit your deployed site
- Click **Sign In**
- Try **Sign in with Google**
- Verify you can create an account

### 2. Test Subscription
- Go to **Pricing** page
- Click **Subscribe** on Basic plan
- Use Stripe test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- Verify subscription activates

### 3. Test Core Features
- Create a new project
- Add a parcel
- Add a note
- Export to CSV
- View analytics

## 🎉 You're Live!

Your ROW Tracking application is now running in production!

## 📱 Next Steps

### Customize Your App

1. **Update Branding**
   - Edit `src/app/page.tsx` for landing page
   - Update colors in `src/components/providers/AppProviders.tsx`
   - Add your logo to `public/` folder

2. **Configure Email**
   - Add SendGrid or Resend for email notifications
   - Set up transactional emails

3. **Add Custom Domain**
   - Go to Vercel project → **Settings** → **Domains**
   - Add your custom domain
   - Update DNS records
   - Update OAuth redirect URIs
   - Update Stripe webhook URL

### Invite Users

1. Share your app URL
2. Users can sign up with Google
3. Start with Free tier
4. Upgrade as needed

### Monitor Your App

1. **Vercel Dashboard** - Traffic and performance
2. **Stripe Dashboard** - Subscriptions and payments
3. **Database Dashboard** - Database health

## 🆘 Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Add to Vercel build command:
prisma generate && next build
```

### OAuth Not Working

**Error: Redirect URI mismatch**
- Check OAuth redirect URIs match exactly
- Must be: `https://yourdomain.com/api/auth/callback/google`
- Update in Google Cloud Console

### Stripe Webhook Fails

**Error: Webhook signature verification failed**
- Use production webhook secret (not test)
- Verify URL is correct: `https://yourdomain.com/api/webhooks/stripe`
- Check webhook is enabled in Stripe Dashboard

### Database Connection Issues

**Error: Can't reach database server**
- Verify DATABASE_URL is correct
- Check database is running
- Add `?sslmode=require` to connection string if needed

## 💡 Tips

1. **Start Small** - Begin with Free tier, upgrade as you grow
2. **Test Thoroughly** - Use Stripe test mode before going live
3. **Backup Regularly** - Set up automatic database backups
4. **Monitor Costs** - Keep an eye on Vercel and database usage
5. **Update Dependencies** - Run `pnpm update` monthly

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Feature Roadmap**: See `FEATURE_SUGGESTIONS.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`

## 🤝 Need Help?

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **GitHub Issues**: Open an issue in your repository

---

**Congratulations! You've successfully deployed your ROW Tracking application! 🎉**

**Now go track some right-of-way parcels!**

