/**
 * SAML Logout Endpoint
 * Mirrors: app/controllers/saml_idp_controller.rb#logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

// Handle logout via GET (HTTP-Redirect binding)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
): Promise<NextResponse> {
  const { year } = await params;

  if (!year || !['2024', '2025'].includes(year)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const samlRequest = searchParams.get('SAMLRequest');
  const samlResponse = searchParams.get('SAMLResponse');
  const relayState = searchParams.get('RelayState');

  // If no SAMLRequest, this is a direct logout
  if (!samlRequest && !samlResponse) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Redirect to sign-in with flash
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('flash', 'signed_out');
    return NextResponse.redirect(signInUrl);
  }

  if (samlRequest) {
    // SP-initiated logout
    // TODO: Validate SAMLRequest, decode, verify signature
    // TODO: Terminate user session
    // TODO: Generate LogoutResponse

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Return LogoutResponse
    // TODO: Build actual SAML LogoutResponse
    return new NextResponse('Logout response placeholder', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (samlResponse) {
    // Response to IdP-initiated logout
    // TODO: Validate SAMLResponse
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// Handle logout via POST (HTTP-POST binding)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
): Promise<NextResponse> {
  const { year } = await params;

  if (!year || !['2024', '2025'].includes(year)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const samlRequest = formData.get('SAMLRequest') as string | null;
  const samlResponse = formData.get('SAMLResponse') as string | null;
  const relayState = formData.get('RelayState') as string | null;

  if (!samlRequest && !samlResponse) {
    return new NextResponse('Bad Request: Missing SAMLRequest or SAMLResponse', { status: 400 });
  }

  // TODO: Handle POST-bound logout similar to GET
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.redirect(new URL('/login', request.url));
}
