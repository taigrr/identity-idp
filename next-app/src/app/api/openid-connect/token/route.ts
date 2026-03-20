/**
 * Token Endpoint
 * /api/openid-connect/token
 * Mirrors: app/controllers/openid_connect/token_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  verifyCodeChallenge,
  validateClientAssertion,
  getTokenEndpointUrl,
  buildIdToken,
  generateAccessToken,
  getOidcConfig,
  CLIENT_ASSERTION_TYPE,
} from '@/lib/oidc';

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

interface ServiceProviderIdentity {
  id: string;
  userId: string;
  serviceProvider: string;
  sessionUuid: string | null;
  accessToken: string;
  nonce: string | null;
  scope: string;
  codeChallenge: string | null;
  acr_values: string | null;
  ial: number;
  requestedAalValue: string | null;
  updatedAt: Date;
  railsSessionId: string;
  emailAddress: {
    email: string;
  };
  user: {
    uuid: string;
  };
}

interface ServiceProvider {
  issuer: string;
  pkce: boolean | null;
  sslCerts: string[];
}

// In a real implementation, these would come from the database
async function findIdentityByCode(code: string): Promise<ServiceProviderIdentity | null> {
  // TODO: Replace with actual database lookup
  // This is a placeholder for the database query:
  // ServiceProviderIdentity.where(session_uuid: code).order(updated_at: :desc).first
  console.log('Looking up identity by code:', code?.slice(0, 8) + '...');
  return null;
}

async function findServiceProvider(issuer: string): Promise<ServiceProvider | null> {
  // TODO: Replace with actual database lookup
  // ServiceProvider.find_by(issuer: issuer)
  console.log('Looking up service provider:', issuer);
  return null;
}

async function clearAuthorizationCode(identityId: string): Promise<void> {
  // TODO: Replace with actual database update
  // identity.update(session_uuid: nil)
  console.log('Clearing authorization code for identity:', identityId);
}

async function getSessionTtl(railsSessionId: string): Promise<number> {
  // TODO: Replace with actual Redis lookup
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
  const identity = await findIdentityByCode(params.code!);

  if (!identity || !identity.user) {
    return NextResponse.json(
      { error: 'Invalid authorization code' },
      { status: 400 },
    );
  }

  // Check if code has expired
  const sessionExpiration = new Date(Date.now() - sessionTimeout * 1000);
  if (identity.updatedAt < sessionExpiration) {
    return NextResponse.json(
      { error: 'Authorization code has expired' },
      { status: 400 },
    );
  }

  // Get service provider
  const serviceProvider = await findServiceProvider(identity.serviceProvider);

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

    const certs = serviceProvider?.sslCerts ?? [];
    if (certs.length === 0) {
      return NextResponse.json(
        { error: 'No certificates configured for service provider' },
        { status: 400 },
      );
    }

    const validation = await validateClientAssertion(
      params.client_assertion,
      params.client_assertion_type,
      identity.serviceProvider,
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
  await clearAuthorizationCode(identity.id);

  // Get session TTL
  const ttl = await getSessionTtl(identity.railsSessionId);

  // Build ID token
  const { token: idToken } = await buildIdToken({
    subject: identity.user.uuid,
    audience: identity.serviceProvider,
    nonce: identity.nonce ?? undefined,
    accessToken: identity.accessToken,
    code: params.code!,
    acr: identity.acr_values ?? undefined,
    userInfo: {
      email: identity.emailAddress.email,
      email_verified: true,
      ial: identity.acr_values ?? undefined,
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
