/**
 * OIDC Authorization Endpoint
 * /api/openid-connect/authorize
 * Mirrors: app/controllers/openid_connect/authorization_controller.rb
 *
 * This endpoint handles the OIDC authorization flow:
 * 1. Validates the authorization request
 * 2. Checks user authentication status
 * 3. Redirects to sign-in if needed
 * 4. Handles prompt=login forcing reauthentication
 * 5. Redirects to IDV if identity proofing required
 * 6. Links identity to service provider
 * 7. Generates authorization code and redirects back to SP
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  validateAuthorizeForm,
  buildSuccessRedirectUri,
  addParamsToUri,
  type ServiceProviderConfig,
  type ParsedAuthorizeParams,
} from '@/lib/oidc/authorize-form';
import { generateAuthorizationCode, generateAccessToken } from '@/lib/oidc';

// Session cookie name
const SESSION_COOKIE_NAME = 'session_id';

// Route constants
const ROUTES = {
  SIGN_IN: '/sign-in',
  SIGN_UP_COMPLETED: '/sign-up/completed',
  IDV: '/idv',
  TWO_FACTOR: '/two-factor',
  CAPTURE_PASSWORD: '/capture-password',
  REACTIVATE_ACCOUNT: '/account/reactivate',
  AUTHORIZATION_CONFIRMATION: '/authorization-confirmation',
  SP_INACTIVE_ERROR: '/errors/sp-inactive',
  PLEASE_CALL: '/please-call',
};

interface User {
  id: string;
  uuid: string;
  email: string;
  identityVerified: boolean;
  identityVerifiedWithFacialMatch: boolean;
  suspended: boolean;
  hasActiveProfile: boolean;
  hasPendingProfile: boolean;
  profileDeactivatedAt?: Date;
}

interface SessionData {
  userId?: string;
  userUuid?: string;
  mfaVerified?: boolean;
  signInFlow?: string;
  spSession?: {
    issuer?: string;
    requestUrl?: string;
    acrValues?: string;
    successfulHandoff?: boolean;
  };
  oidcStateForLoginPrompt?: string;
  authCount?: number;
  firstVisitForSp?: boolean;
  selectedEmailIdForLinkedIdentity?: string;
}

interface ServiceProviderIdentity {
  id: string;
  sessionUuid: string;
  accessToken: string;
  emailAddressId?: string;
}

// TODO: Replace with actual database/session lookups
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  // Mock session data for development
  return null;
}

async function getUser(userId: string): Promise<User | null> {
  console.log('Getting user:', userId);
  // Mock user data for development
  return null;
}

async function getServiceProvider(clientId: string): Promise<ServiceProviderConfig | null> {
  console.log('Getting service provider:', clientId);
  // TODO: Replace with actual database lookup
  // ServiceProvider.find_by(issuer: clientId)
  return null;
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
  // TODO: Replace with actual session update
}

async function linkIdentityToServiceProvider(
  userId: string,
  params: ParsedAuthorizeParams,
  sessionId: string,
  emailAddressId?: string,
): Promise<ServiceProviderIdentity> {
  console.log('Linking identity for user:', userId, 'to SP:', params.clientId);

  // Generate authorization code and access token
  const sessionUuid = generateAuthorizationCode();
  const accessToken = generateAccessToken();

  // TODO: Replace with actual database operation
  // identity = IdentityLinker.new(current_user, service_provider).link_identity(...)
  // This creates/updates a ServiceProviderIdentity record

  return {
    id: 'mock-identity-id',
    sessionUuid,
    accessToken,
    emailAddressId,
  };
}

async function destroySession(sessionId: string): Promise<void> {
  console.log('Destroying session:', sessionId?.slice(0, 8) + '...');
  // TODO: Replace with actual session destruction
}

/**
 * Calculate IAL from parsed params
 */
function calculateIal(params: ParsedAuthorizeParams): number {
  if (params.ialMaxRequested) return 0;
  if (params.identityProofingRequested) return 2;
  return 1;
}

/**
 * Check if user needs identity verification
 */
function needsIdentityVerification(user: User, params: ParsedAuthorizeParams): boolean {
  if (!params.identityProofingRequested && !params.ialMaxRequested) {
    return false;
  }
  return !user.identityVerified;
}

/**
 * Check if user needs facial match verification
 */
function needsFacialMatchVerification(user: User, params: ParsedAuthorizeParams): boolean {
  if (!params.facialMatchRequested) {
    return false;
  }
  return !user.identityVerifiedWithFacialMatch;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Extract authorization parameters
  const params = {
    client_id: searchParams.get('client_id') ?? undefined,
    redirect_uri: searchParams.get('redirect_uri') ?? undefined,
    response_type: searchParams.get('response_type') ?? undefined,
    scope: searchParams.get('scope') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    nonce: searchParams.get('nonce') ?? undefined,
    acr_values: searchParams.get('acr_values') ?? undefined,
    code_challenge: searchParams.get('code_challenge') ?? undefined,
    code_challenge_method: searchParams.get('code_challenge_method') ?? undefined,
    prompt: searchParams.get('prompt') ?? undefined,
    verified_within: searchParams.get('verified_within') ?? undefined,
  };

  // Pre-fetch service provider for validation (validateAuthorizeForm expects sync getter)
  const cachedServiceProvider = params.client_id
    ? await getServiceProvider(params.client_id)
    : null;

  // Validate the authorization request
  const result = validateAuthorizeForm(params, (clientId) =>
    clientId === params.client_id ? cachedServiceProvider : null,
  );

  if (!result.success) {
    // If we can redirect with error, do so
    if (result.errorRedirectUri) {
      return NextResponse.redirect(result.errorRedirectUri);
    }

    // Otherwise render an error page
    return new NextResponse(
      JSON.stringify({
        error: 'invalid_request',
        error_description: Object.values(result.errors).join(' '),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const validatedParams = result.params;

  // Get service provider and check if active
  const serviceProvider = await getServiceProvider(validatedParams.clientId);
  if (!serviceProvider?.active) {
    return NextResponse.redirect(new URL(ROUTES.SP_INACTIVE_ERROR, request.url));
  }

  // Get session data
  const session = sessionId ? await getSession(sessionId) : null;
  const userId = session?.userId;

  // Store the authorization request in the session
  if (sessionId) {
    await updateSession(sessionId, {
      spSession: {
        issuer: validatedParams.clientId,
        requestUrl: request.url,
        acrValues: validatedParams.acrValues.join(' '),
      },
    });
  }

  // Handle prompt=login - sign out and redirect back
  if (validatedParams.prompt === 'login') {
    if (session?.oidcStateForLoginPrompt !== validatedParams.state) {
      // First time seeing this state - store it and check if we need to sign out
      if (sessionId) {
        await updateSession(sessionId, {
          oidcStateForLoginPrompt: validatedParams.state,
        });
      }

      // If user is signed in and this isn't continuing a login flow, sign them out
      if (userId && session?.spSession?.requestUrl !== request.url) {
        await destroySession(sessionId!);
        // Redirect back to this endpoint to start fresh
        return NextResponse.redirect(request.url);
      }
    }
  }

  // If user is not signed in, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL(ROUTES.SIGN_IN, request.url);
    signInUrl.searchParams.set('request_id', sessionId || '');
    return NextResponse.redirect(signInUrl);
  }

  // Get user data
  const user = await getUser(userId);
  if (!user) {
    // User not found - redirect to sign-in
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }

  // Check if user is suspended
  if (user.suspended) {
    return NextResponse.redirect(new URL(ROUTES.PLEASE_CALL, request.url));
  }

  // Check MFA status
  if (!session?.mfaVerified) {
    return NextResponse.redirect(new URL(ROUTES.TWO_FACTOR, request.url));
  }

  // Identity proofing checks
  if (validatedParams.identityProofingRequested || validatedParams.ialMaxRequested) {
    // Check if user needs to reactivate account
    if (user.profileDeactivatedAt) {
      return NextResponse.redirect(new URL(ROUTES.REACTIVATE_ACCOUNT, request.url));
    }

    // Check if user has pending profile
    if (user.hasPendingProfile) {
      // TODO: Redirect to appropriate pending profile page
      return NextResponse.redirect(new URL(ROUTES.IDV, request.url));
    }

    // Check if identity verification is needed
    if (needsIdentityVerification(user, validatedParams)) {
      return NextResponse.redirect(new URL(ROUTES.IDV, request.url));
    }

    // Check if facial match verification is needed
    if (needsFacialMatchVerification(user, validatedParams)) {
      return NextResponse.redirect(new URL(ROUTES.IDV, request.url));
    }
  }

  // Check if completion screen is needed
  // (e.g., first time user connects to this SP, or SP requires consent)
  const authCount = (session?.authCount || 0) + 1;
  const isFirstVisitForSp = session?.firstVisitForSp !== false;

  if (authCount === 1 && isFirstVisitForSp) {
    // Update auth count
    if (sessionId) {
      await updateSession(sessionId, { authCount });
    }
    // Redirect to authorization confirmation page
    return NextResponse.redirect(new URL(ROUTES.AUTHORIZATION_CONFIRMATION, request.url));
  }

  // Link identity to service provider
  const ial = calculateIal(validatedParams);
  const identity = await linkIdentityToServiceProvider(
    userId,
    validatedParams,
    sessionId || '',
    session?.selectedEmailIdForLinkedIdentity,
  );

  // Build success redirect URI
  const redirectUri = buildSuccessRedirectUri(
    validatedParams.redirectUri,
    identity.sessionUuid,
    validatedParams.state,
  );

  // Update session to mark successful handoff
  if (sessionId) {
    await updateSession(sessionId, {
      authCount,
      spSession: {
        ...session?.spSession,
        successfulHandoff: true,
      },
    });
  }

  // Redirect to service provider
  return NextResponse.redirect(redirectUri);
}

/**
 * POST is also supported for authorization requests
 * (Some SPs send POST requests with form data)
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  // Convert form data to URL search params
  const url = new URL(request.url);
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      url.searchParams.set(key, value);
    }
  }

  // Create a new request with the params and delegate to GET
  const getRequest = new NextRequest(url, {
    method: 'GET',
    headers: request.headers,
  });

  return GET(getRequest);
}
