/**
 * OIDC Logout Endpoint
 * /api/openid-connect/logout
 * Handles OIDC RP-initiated logout
 * Mirrors: app/controllers/openid_connect/logout_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/oidc';

const SESSION_COOKIE_NAME = 'session_id';

interface LogoutParams {
  client_id?: string;
  id_token_hint?: string;
  post_logout_redirect_uri?: string;
  state?: string;
}

interface SessionData {
  userId?: string;
  userUuid?: string;
}

interface ServiceProvider {
  issuer: string;
  name: string;
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function destroySession(sessionId: string): Promise<void> {
  console.log('Destroying session:', sessionId?.slice(0, 8) + '...');
}

async function getServiceProvider(clientId: string): Promise<ServiceProvider | null> {
  console.log('Getting SP:', clientId);
  return null;
}

async function getServiceProviderBySubject(subject: string): Promise<ServiceProvider | null> {
  console.log('Getting SP by subject:', subject);
  return null;
}

function isValidPostLogoutRedirectUri(uri: string, sp: ServiceProvider): boolean {
  // Check if URI is in the allowed list
  const allowedUris = sp.postLogoutRedirectUris || sp.redirectUris;
  return allowedUris.some((allowed) => uri === allowed || uri.startsWith(allowed));
}

/**
 * GET - Handle logout request with confirmation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: LogoutParams = {
    client_id: searchParams.get('client_id') ?? undefined,
    id_token_hint: searchParams.get('id_token_hint') ?? undefined,
    post_logout_redirect_uri: searchParams.get('post_logout_redirect_uri') ?? undefined,
    state: searchParams.get('state') ?? undefined,
  };

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Validate the logout request
  let serviceProvider: ServiceProvider | null = null;
  let redirectUri = params.post_logout_redirect_uri;

  // Try to identify SP from client_id or id_token_hint
  if (params.client_id) {
    serviceProvider = await getServiceProvider(params.client_id);
  } else if (params.id_token_hint) {
    // Verify the id_token_hint to get the subject/client
    const claims = await verifyIdToken(params.id_token_hint, { ignoreExpiration: true });
    if (claims?.aud) {
      const audience = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
      serviceProvider = await getServiceProvider(audience as string);
    }
  }

  // Validate redirect URI
  if (redirectUri && serviceProvider) {
    if (!isValidPostLogoutRedirectUri(redirectUri, serviceProvider)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid post_logout_redirect_uri' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // If user is signed in, redirect to confirmation page
  if (sessionId) {
    const session = await getSession(sessionId);
    if (session?.userId) {
      // Build confirmation page URL with params
      const confirmUrl = new URL('/sign-out/confirm', request.url);
      if (params.client_id) confirmUrl.searchParams.set('client_id', params.client_id);
      if (params.post_logout_redirect_uri) confirmUrl.searchParams.set('redirect_uri', params.post_logout_redirect_uri);
      if (params.state) confirmUrl.searchParams.set('state', params.state);
      if (serviceProvider) confirmUrl.searchParams.set('sp_name', serviceProvider.name);

      return NextResponse.redirect(confirmUrl);
    }
  }

  // User not signed in - redirect directly
  if (redirectUri) {
    if (params.state) {
      const url = new URL(redirectUri);
      url.searchParams.set('state', params.state);
      redirectUri = url.toString();
    }
    return NextResponse.redirect(redirectUri);
  }

  // No redirect URI - go to sign-in page
  return NextResponse.redirect(new URL('/sign-in', request.url));
}

/**
 * POST - Handle logout form submission (redirects to GET)
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  // Convert form data to URL params and redirect to GET
  const url = new URL(request.url);
  const params = ['client_id', 'id_token_hint', 'post_logout_redirect_uri', 'state'];
  for (const param of params) {
    const value = formData.get(param);
    if (typeof value === 'string') {
      url.searchParams.set(param, value);
    }
  }

  return NextResponse.redirect(url);
}

/**
 * DELETE - Actually perform logout
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: LogoutParams = {
    client_id: searchParams.get('client_id') ?? undefined,
    post_logout_redirect_uri: searchParams.get('post_logout_redirect_uri') ?? undefined,
    state: searchParams.get('state') ?? undefined,
  };

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Destroy session if exists
  if (sessionId) {
    await destroySession(sessionId);
  }

  // Clear session cookie
  const mutableCookies = await cookies();
  mutableCookies.delete(SESSION_COOKIE_NAME);

  // Build redirect URI
  let redirectUri = params.post_logout_redirect_uri || '/';

  if (params.state && params.post_logout_redirect_uri) {
    const url = new URL(redirectUri);
    url.searchParams.set('state', params.state);
    redirectUri = url.toString();
  }

  return NextResponse.redirect(new URL(redirectUri, request.url));
}
