import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { tier } = body;
    
    if (!tier || !['BASIC', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    const priceId = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES];
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }
    
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      priceId,
      session.user.email!
    );
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

