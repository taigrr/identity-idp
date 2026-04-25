/**
 * SAML Auth Endpoint
 * Mirrors: app/controllers/saml_idp_controller.rb#auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

// SAML Auth via GET (HTTP-Redirect binding)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
): Promise<NextResponse> {
  const { year } = await params;

  // Validate path year
  if (!year || !['2024', '2025'].includes(year)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const samlRequest = searchParams.get('SAMLRequest');
  const relayState = searchParams.get('RelayState');
  const sigAlg = searchParams.get('SigAlg');
  const signature = searchParams.get('Signature');

  if (!samlRequest) {
    return new NextResponse('Bad Request: Missing SAMLRequest', { status: 400 });
  }

  // TODO: Replace with actual SAML request parsing
  // 1. URL-decode and inflate SAMLRequest
  // 2. Validate signature if present
  // 3. Parse AuthnRequest
  // 4. Validate SP and redirect

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Store SAML request context for later
  // TODO: Store in session/redis
  // session.samlRequest = { samlRequest, relayState, sigAlg, signature };

  if (!sessionId) {
    // Redirect to login
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('request_id', 'saml-' + Date.now());
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, check if more steps needed
  // TODO: Check 2FA, IAL requirements, etc.

  return NextResponse.redirect(new URL('/authorization-confirmation', request.url));
}

// SAML Auth via POST (HTTP-POST binding)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
): Promise<NextResponse> {
  const { year } = await params;

  if (!year || !['2024', '2025'].includes(year)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const samlRequest = formData.get('SAMLRequest') as string;
  const relayState = formData.get('RelayState') as string | null;

  if (!samlRequest) {
    return new NextResponse('Bad Request: Missing SAMLRequest', { status: 400 });
  }

  // TODO: Replace with actual SAML POST handling
  // Similar to GET but for POST binding

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('request_id', 'saml-' + Date.now());
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.redirect(new URL('/authorization-confirmation', request.url));
}
