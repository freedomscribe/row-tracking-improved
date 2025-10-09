import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, getTierFromPriceId, SUBSCRIPTION_TIERS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.userId;

          if (!userId) {
            console.error('No userId in session metadata');
            break;
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          const tier = getTierFromPriceId(priceId);
          const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

          // Update user subscription
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              tier,
              status: 'ACTIVE',
              projectLimit: tierConfig.projectLimit,
              parcelLimitPerProject: tierConfig.parcelLimitPerProject,
              userLimit: tierConfig.userLimit,
              storageLimit: tierConfig.storageLimit,
            },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              tier,
              status: 'ACTIVE',
              projectLimit: tierConfig.projectLimit,
              parcelLimitPerProject: tierConfig.parcelLimitPerProject,
              userLimit: tierConfig.userLimit,
              storageLimit: tierConfig.storageLimit,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const tier = getTierFromPriceId(priceId);
        const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            tier,
            status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
            projectLimit: tierConfig.projectLimit,
            parcelLimitPerProject: tierConfig.parcelLimitPerProject,
            userLimit: tierConfig.userLimit,
            storageLimit: tierConfig.storageLimit,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free tier
        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            tier: 'FREE',
            status: 'CANCELED',
            projectLimit: 2,
            parcelLimitPerProject: 50,
            userLimit: 1,
            storageLimit: 0,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'PAST_DUE',
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'ACTIVE',
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

