import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Return to SP Controller
 * Mirrors: app/controllers/redirect/return_to_sp_controller.rb
 * Route: GET /redirect/return-to-sp
 */

interface SessionData {
  spSession?: {
    requestUrl?: string;
    issuer?: string;
  };
}

// TODO: Replace with actual session retrieval
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return {
    spSession: {
      requestUrl: 'http://localhost:3001/auth/result',
      issuer: 'urn:gov:gsa:openidconnect:sp:test',
    },
  };
}

async function getSpCancelUrl(issuer: string): Promise<string | null> {
  // TODO: Look up SP's cancel URL from database
  return 'http://localhost:3001/auth/cancel';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/sign-in', request.url), { status: 302 });
  }

  const session = await getSession(sessionId);

  if (!session?.spSession?.issuer) {
    return NextResponse.redirect(new URL('/account', request.url), { status: 302 });
  }

  let redirectUrl: string | null = null;

  switch (action) {
    case 'cancel':
      redirectUrl = await getSpCancelUrl(session.spSession.issuer);
      break;

    case 'failure_to_proof':
      // Add failure parameters to the SP's request URL
      if (session.spSession.requestUrl) {
        const url = new URL(session.spSession.requestUrl);
        url.searchParams.set('error', 'identity_proofing_failed');
        redirectUrl = url.toString();
      }
      break;

    default:
      // Default redirect back to SP request URL
      redirectUrl = session.spSession.requestUrl || null;
  }

  if (!redirectUrl) {
    return NextResponse.redirect(new URL('/account', request.url), { status: 302 });
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
