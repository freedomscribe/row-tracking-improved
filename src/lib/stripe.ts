import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const STRIPE_PRICES = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID || '',
  PRO: process.env.STRIPE_PRO_PRICE_ID || '',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
};

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    projectLimit: 2,
    parcelLimitPerProject: 50,
    userLimit: 1,
    storageLimit: 0,
    features: [
      'Up to 2 projects',
      'Up to 50 parcels per project',
      'Basic map visualization',
      'Parcel management',
      'Limited notes (10 per parcel)',
      'CSV exports only',
      'Community support',
    ],
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    projectLimit: 10,
    parcelLimitPerProject: 200,
    userLimit: 3,
    storageLimit: 100,
    features: [
      'Up to 10 projects',
      'Up to 200 parcels per project',
      'All Free features',
      'Unlimited notes',
      'PDF exports',
      'Dashboard analytics',
      'Email support',
      '100MB document storage',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 99,
    projectLimit: -1, // unlimited
    parcelLimitPerProject: -1, // unlimited
    userLimit: 10,
    storageLimit: 1024,
    features: [
      'Unlimited projects',
      'Unlimited parcels',
      'All Basic features',
      'Advanced analytics',
      'Custom reports',
      'Bulk operations',
      'Priority support',
      '1GB document storage',
      'API access',
      'Custom branding',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 'Custom',
    projectLimit: -1,
    parcelLimitPerProject: -1,
    userLimit: -1,
    storageLimit: -1,
    features: [
      'Everything in Pro',
      'Unlimited users',
      'Unlimited storage',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'Training sessions',
      'White-label option',
      'On-premise deployment',
    ],
  },
};

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  email: string
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return session;
}

export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

export function getTierFromPriceId(priceId: string): string {
  if (priceId === STRIPE_PRICES.BASIC) return 'BASIC';
  if (priceId === STRIPE_PRICES.PRO) return 'PRO';
  if (priceId === STRIPE_PRICES.ENTERPRISE) return 'ENTERPRISE';
  return 'FREE';
}

