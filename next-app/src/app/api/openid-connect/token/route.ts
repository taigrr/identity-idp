/**
 * Token Endpoint
 * /api/openid-connect/token
 * Mirrors: app/controllers/openid_connect/token_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCodeChallenge,
  validateClientAssertion,
  getTokenEndpointUrl,
  buildIdToken,
  getOidcConfig,
  CLIENT_ASSERTION_TYPE,
  createOidcQueries,
  type TokenIdentity,
  type ServiceProviderData,
} from '@/lib/oidc';
import { db } from '@/db';

interface TokenRequest {
  grant_type?: string;
  code?: string;
  code_verifier?: string;
  client_assertion?: string;
  client_assertion_type?: string;
}

interface TokenError {
  error: string;
  error_description?: string;
}

// Create queries with database instance
const queries = createOidcQueries(db);

/**
 * Get session TTL from Rails session (Redis)
 * TODO: Implement Redis lookup for session TTL
 */
async function getSessionTtl(_railsSessionId: string): Promise<number> {
  // In production, this would look up the TTL from Redis:
  // OutOfBandSessionAccessor.new(identity.rails_session_id).ttl
  const config = getOidcConfig();
  return config.tokenTtl;
}

export async function POST(request: NextRequest) {
  const config = getOidcConfig();
  const sessionTimeout = config.sessionTimeout;

  // Parse form data
  const formData = await request.formData();
  const params: TokenRequest = {
    grant_type: formData.get('grant_type') as string | undefined,
    code: formData.get('code') as string | undefined,
    code_verifier: formData.get('code_verifier') as string | undefined,
    client_assertion: formData.get('client_assertion') as string | undefined,
    client_assertion_type: formData.get('client_assertion_type') as string | undefined,
  };

  const errors: TokenError[] = [];

  // Validate grant_type
  if (params.grant_type !== 'authorization_code') {
    errors.push({
      error: 'unsupported_grant_type',
      error_description: 'grant_type must be authorization_code',
    });
  }

  // Validate code
  if (!params.code || params.code.includes('\x00')) {
    errors.push({
      error: 'invalid_grant',
      error_description: 'Invalid authorization code',
    });
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors.map((e) => e.error_description).join(' ') },
      { status: 400 },
    );
  }

  // Find identity by code
  let identity: TokenIdentity | null = null;
  try {
    identity = await queries.findIdentityByCode(params.code!);
  } catch (error) {
    console.error('Database error finding identity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }

  if (!identity || !identity.user) {
    return NextResponse.json(
      { error: 'Invalid authorization code' },
      { status: 400 },
    );
  }

  // Check if code has expired
  const sessionExpiration = new Date(Date.now() - sessionTimeout * 1000);
  if (identity.updatedAt && identity.updatedAt < sessionExpiration) {
    return NextResponse.json(
      { error: 'Authorization code has expired' },
      { status: 400 },
    );
  }

  // Get service provider
  let serviceProvider: ServiceProviderData | null = null;
  if (identity.serviceProvider) {
    try {
      serviceProvider = await queries.findServiceProvider(identity.serviceProvider);
    } catch (error) {
      console.error('Database error finding service provider:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  }

  // Determine authentication method: PKCE or private_key_jwt
  const isPkce = serviceProvider?.pkce !== false &&
    (params.code_verifier || identity.codeChallenge);
  const isPrivateKeyJwt = serviceProvider?.pkce === false &&
    (params.client_assertion || params.client_assertion_type);

  if (!isPkce && !isPrivateKeyJwt) {
    return NextResponse.json(
      { error: 'Invalid authentication method' },
      { status: 400 },
    );
  }

  // Validate PKCE
  if (isPkce) {
    if (!params.code_verifier) {
      return NextResponse.json(
        { error: 'code_verifier is required' },
        { status: 400 },
      );
    }

    if (!identity.codeChallenge) {
      return NextResponse.json(
        { error: 'No code_challenge stored for this authorization' },
        { status: 400 },
      );
    }

    if (!verifyCodeChallenge(params.code_verifier, identity.codeChallenge)) {
      return NextResponse.json(
        { error: 'Invalid code_verifier' },
        { status: 400 },
      );
    }
  }

  // Validate private_key_jwt
  if (isPrivateKeyJwt) {
    if (!params.client_assertion) {
      return NextResponse.json(
        { error: 'client_assertion is required' },
        { status: 400 },
      );
    }

    if (params.client_assertion_type !== CLIENT_ASSERTION_TYPE) {
      return NextResponse.json(
        { error: `client_assertion_type must be ${CLIENT_ASSERTION_TYPE}` },
        { status: 400 },
      );
    }

    const certs = serviceProvider?.certs ?? [];
    if (certs.length === 0) {
      return NextResponse.json(
        { error: 'No certificates configured for service provider' },
        { status: 400 },
      );
    }

    const validation = await validateClientAssertion(
      params.client_assertion,
      params.client_assertion_type,
      identity.serviceProvider!,
      certs,
      getTokenEndpointUrl(),
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }
  }

  // Clear the authorization code (single use)
  try {
    await queries.clearAuthorizationCode(identity.id);
  } catch (error) {
    console.error('Database error clearing authorization code:', error);
    // Continue - this is not a blocking error
  }

  // Get session TTL
  const ttl = await getSessionTtl(identity.railsSessionId ?? '');

  // Build ID token
  // For email, we need to decrypt the encrypted email
  // TODO: Implement email decryption via KMS
  const email = identity.emailAddress?.encryptedEmail ?? '';
  const decryptedEmail = email; // Placeholder - needs KMS decryption

  const { token: idToken } = await buildIdToken({
    subject: identity.user.uuid,
    audience: identity.serviceProvider!,
    nonce: identity.nonce ?? undefined,
    accessToken: identity.accessToken!,
    code: params.code!,
    acr: identity.acrValues ?? undefined,
    userInfo: {
      email: decryptedEmail,
      email_verified: true,
      ial: identity.acrValues ?? undefined,
      aal: identity.requestedAalValue ?? undefined,
    },
    ttl,
  });

  // Return token response
  return NextResponse.json({
    access_token: identity.accessToken,
    token_type: 'Bearer',
    expires_in: ttl,
    id_token: idToken,
  });
}

// Support CORS preflight for token endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
