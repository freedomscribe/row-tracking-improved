# ROW Tracking - Enhanced Version 2.0

A modern, production-ready Right-of-Way (ROW) tracking application for electrical transmission line projects with subscription management, advanced analytics, and export capabilities.

## 🚀 Features

### Core Features
- **Interactive Map Visualization** - Leaflet-based maps with color-coded parcel status
- **Project Management** - Create and manage multiple ROW projects
- **Parcel Tracking** - Comprehensive parcel information with notes and documents
- **Status Management** - Track acquisition progress (Not Started, In Progress, Acquired, Condemned, Relocated)
- **Dashboard Analytics** - Real-time statistics and visualizations with Recharts
- **Export Functionality** - Generate line lists in CSV and PDF formats
- **Document Management** - Upload and manage parcel-related documents

### Authentication
- **Google OAuth** - One-click sign-in with Google
- **GitHub OAuth** - Sign in with GitHub (optional)
- **Email/Password** - Traditional authentication
- **Secure Sessions** - JWT-based authentication with NextAuth.js

### Subscription Tiers
- **Free** - 2 projects, 50 parcels per project
- **Basic ($29/mo)** - 10 projects, 200 parcels per project, PDF exports
- **Pro ($99/mo)** - Unlimited projects and parcels, advanced analytics
- **Enterprise (Custom)** - Custom features and dedicated support

### Technical Highlights
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **PostgreSQL** database with Prisma ORM
- **Stripe** integration for subscription management
- **Material-UI (MUI)** for beautiful UI components
- **Framer Motion** for smooth animations
- **Vercel-ready** deployment configuration

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (local or cloud)
- Google OAuth credentials
- Stripe account (for payments)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd row-tracking-improved
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/row_tracking"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

### 4. Set Up Database

Run Prisma migrations:

```bash
pnpm prisma generate
pnpm prisma db push
```

For production, use:

```bash
pnpm prisma migrate deploy
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Setting Up OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

### GitHub OAuth (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - Homepage URL: `http://localhost:3000` (dev) or your domain
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy **Client ID** and **Client Secret** to `.env.local`

## 💳 Setting Up Stripe

### 1. Create Stripe Account

1. Sign up at [Stripe](https://stripe.com)
2. Get your API keys from the Dashboard

### 2. Create Products and Prices

1. Go to **Products** in Stripe Dashboard
2. Create three products:
   - **Basic Plan** - $29/month
   - **Pro Plan** - $99/month
   - **Enterprise Plan** - Custom pricing
3. Copy the **Price IDs** to `.env.local`

### 3. Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Add endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
3. Copy **Webhook Secret** to `.env.local`

For local testing, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **accounts** - OAuth provider accounts
- **sessions** - User sessions
- **subscriptions** - Subscription tiers and limits
- **projects** - ROW projects
- **parcels** - Land parcels with geometry
- **notes** - Parcel notes and comments
- **documents** - Uploaded documents

## 📦 Deployment to Vercel

### 1. Install Vercel CLI

```bash
pnpm install -g vercel
```

### 2. Set Up Vercel Postgres

```bash
vercel postgres create
```

### 3. Link Project

```bash
vercel link
```

### 4. Set Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add STRIPE_SECRET_KEY
# ... add all other environment variables
```

### 5. Deploy

```bash
vercel --prod
```

### 6. Run Database Migrations

After deployment:

```bash
vercel env pull .env.production
pnpm prisma migrate deploy
```

## 🎨 Project Structure

```
row-tracking-improved/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   ├── lib/                  # Utilities and configurations
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── stripe.ts         # Stripe utilities
│   │   ├── utils.ts          # Helper functions
│   │   ├── validations.ts    # Zod schemas
│   │   └── exports.ts        # Export utilities
│   └── middleware.ts         # Route protection
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

## 🔧 Development Scripts

```bash
# Development
pnpm dev                      # Start dev server
pnpm build                    # Build for production
pnpm start                    # Start production server
pnpm lint                     # Run ESLint

# Database
pnpm prisma:generate          # Generate Prisma client
pnpm prisma:migrate           # Run migrations (dev)
pnpm prisma:studio            # Open Prisma Studio
pnpm prisma:push              # Push schema to database
```

## 📊 Subscription Limits

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Projects | 2 | 10 | Unlimited | Unlimited |
| Parcels/Project | 50 | 200 | Unlimited | Unlimited |
| Users | 1 | 3 | 10 | Unlimited |
| Storage | 0 MB | 100 MB | 1 GB | Unlimited |
| CSV Export | ✅ | ✅ | ✅ | ✅ |
| PDF Export | ❌ | ✅ | ✅ | ✅ |
| Analytics | Basic | ✅ | Advanced | Advanced |
| API Access | ❌ | ❌ | ✅ | ✅ |
| Support | Community | Email | Priority | Dedicated |

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced GIS features
- [ ] Integration with county GIS systems
- [ ] Automated email notifications
- [ ] Custom report builder
- [ ] API for third-party integrations
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline mode with sync

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
pnpm prisma db pull
```

### OAuth Redirect Issues

Make sure your OAuth redirect URIs match exactly:
- Include `/api/auth/callback/google` or `/callback/github`
- Use HTTPS in production
- Update `.env.local` with correct `NEXTAUTH_URL`

### Stripe Webhook Issues

Test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For support, email support@rowtracking.com or open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.

