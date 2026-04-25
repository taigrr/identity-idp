import { NextRequest, NextResponse } from 'next/server';

/**
 * Stripe Webhooks API
 * Mirrors: app/controllers/api/stripe/webhooks_controller.rb
 * Route: POST /api/webhooks/stripe
 */

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      metadata?: Record<string, string>;
    };
  };
}

// TODO: Replace with actual implementations
async function verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
  // In production, use Stripe's webhook signature verification
  console.log('Verifying Stripe signature');
  return true;
}

async function handleVerificationCompleted(sessionId: string, metadata?: Record<string, string>): Promise<void> {
  console.log('Handling verification completed:', { sessionId, metadata });
  // TODO: Update document verification status in database
}

async function handleVerificationRequiresInput(sessionId: string, metadata?: Record<string, string>): Promise<void> {
  console.log('Handling verification requires input:', { sessionId, metadata });
  // TODO: Update status and potentially notify user
}

async function handleVerificationCanceled(sessionId: string, metadata?: Record<string, string>): Promise<void> {
  console.log('Handling verification canceled:', { sessionId, metadata });
  // TODO: Update status
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await request.text();

  const isValid = await verifyStripeSignature(payload, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { type, data } = event;
  const session = data.object;

  switch (type) {
    case 'identity.verification_session.verified':
      await handleVerificationCompleted(session.id, session.metadata);
      break;

    case 'identity.verification_session.requires_input':
      await handleVerificationRequiresInput(session.id, session.metadata);
      break;

    case 'identity.verification_session.canceled':
      await handleVerificationCanceled(session.id, session.metadata);
      break;

    default:
      console.log('Unhandled Stripe event type:', type);
  }

  return NextResponse.json({ received: true });
}
