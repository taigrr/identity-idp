/**
 * UserInfo Endpoint
 * /api/openid-connect/userinfo
 * Mirrors: app/controllers/openid_connect/user_info_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAccessToken,
  buildUserInfo,
  getOidcConfig,
  type UserInfoIdentity,
  type UserInfoUser,
  type UserInfoServiceProvider,
  type UserInfoDeps,
  type AccessTokenVerifierDeps,
} from '@/lib/oidc';

// Database query functions - these would be implemented with actual DB access
// For now, they're stubs that demonstrate the expected interface

async function findIdentityByAccessToken(accessToken: string): Promise<{
  identity: UserInfoIdentity;
  user: UserInfoUser;
  serviceProvider: UserInfoServiceProvider | null;
  email: string;
} | null> {
  // TODO: Implement with actual database query
  // SELECT i.*, u.*, sp.*, ea.email
  // FROM identities i
  // JOIN users u ON i.user_id = u.id
  // LEFT JOIN service_providers sp ON i.service_provider = sp.issuer
  // JOIN email_addresses ea ON i.email_address_id = ea.id
  // WHERE i.access_token = $1
  console.log('Looking up identity by access token:', accessToken?.slice(0, 8) + '...');
  return null;
}

async function getSessionTtl(sessionId: string): Promise<number> {
  // TODO: Implement with actual Redis lookup
  // OutOfBandSessionAccessor.new(rails_session_id).ttl
  console.log('Getting session TTL for:', sessionId);
  const config = getOidcConfig();
  return config.sessionTimeout;
}

async function loadPii(profileId: string) {
  // TODO: Implement with actual encrypted PII lookup from session storage
  console.log('Loading PII for profile:', profileId);
  return null;
}

async function loadX509(sessionId: string) {
  // TODO: Implement with actual X509 data lookup from session
  console.log('Loading X509 data for session:', sessionId);
  return null;
}

async function loadWebLocale(sessionId: string): Promise<string | null> {
  // TODO: Implement with actual locale lookup from session
  console.log('Loading web locale for session:', sessionId);
  return null;
}

async function getAgencyUuid(identity: UserInfoIdentity): Promise<string> {
  // TODO: Implement with AgencyIdentityLinker logic
  // AgencyIdentityLinker.new(identity).link_identity.uuid
  return identity.uuid;
}

function t(key: string): string {
  // Simple translation function - in production would use i18n
  const translations: Record<string, string> = {
    'openid_connect.user_info.errors.no_authorization': 'No authorization header',
    'openid_connect.user_info.errors.malformed_authorization': 'Malformed authorization header',
    'openid_connect.user_info.errors.not_found': 'Access token not found or expired',
  };
  return translations[key] ?? key;
}

export async function GET(request: NextRequest) {
  const config = getOidcConfig();

  // Create dependencies for access token verifier
  const verifierDeps: AccessTokenVerifierDeps = {
    findIdentityByAccessToken: async (token) => {
      const result = await findIdentityByAccessToken(token);
      if (!result) return null;
      return {
        id: result.identity.id,
        userId: result.identity.userId,
        serviceProvider: result.identity.serviceProvider,
        accessToken: token,
        ial: result.identity.ial ?? undefined,
        railsSessionId: result.identity.railsSessionId ?? undefined,
        verifiedAt: result.identity.verifiedAt,
      };
    },
    getSessionTtl,
    t,
  };

  // Verify the access token
  const authHeader = request.headers.get('Authorization');
  const verifyResult = await verifyAccessToken(authHeader, verifierDeps);

  if (!verifyResult.success) {
    return NextResponse.json(
      { error: verifyResult.errors.map((e) => e.message).join(' ') },
      { status: 401 }
    );
  }

  // Load full identity data with user and service provider
  const accessToken = authHeader?.split(' ')[1];
  const fullData = await findIdentityByAccessToken(accessToken!);

  if (!fullData) {
    return NextResponse.json(
      { error: 'Identity not found' },
      { status: 401 }
    );
  }

  // Create dependencies for userinfo presenter
  const userinfoDeps: UserInfoDeps = {
    getIssuerUrl: () => config.issuer,
    loadPii,
    loadX509,
    loadWebLocale,
    getAgencyUuid,
  };

  // Build the userinfo response
  const userInfo = await buildUserInfo(
    fullData.identity,
    fullData.user,
    fullData.serviceProvider,
    fullData.email,
    userinfoDeps
  );

  return NextResponse.json(userInfo);
}

/**
 * POST handler for userinfo endpoint
 * Accepts access_token in form body
 */
export async function POST(request: NextRequest) {
  const config = getOidcConfig();

  // Get access token from form body
  const formData = await request.formData();
  const accessToken = formData.get('access_token') as string | null;

  if (!accessToken) {
    return NextResponse.json(
      { error: t('openid_connect.user_info.errors.no_authorization') },
      { status: 401 }
    );
  }

  // Create dependencies for access token verifier
  const verifierDeps: AccessTokenVerifierDeps = {
    findIdentityByAccessToken: async (token) => {
      const result = await findIdentityByAccessToken(token);
      if (!result) return null;
      return {
        id: result.identity.id,
        userId: result.identity.userId,
        serviceProvider: result.identity.serviceProvider,
        accessToken: token,
        ial: result.identity.ial ?? undefined,
        railsSessionId: result.identity.railsSessionId ?? undefined,
        verifiedAt: result.identity.verifiedAt,
      };
    },
    getSessionTtl,
    t,
  };

  // Verify using Bearer header format internally
  const verifyResult = await verifyAccessToken(`Bearer ${accessToken}`, verifierDeps);

  if (!verifyResult.success) {
    return NextResponse.json(
      { error: verifyResult.errors.map((e) => e.message).join(' ') },
      { status: 401 }
    );
  }

  // Load full identity data with user and service provider
  const fullData = await findIdentityByAccessToken(accessToken);

  if (!fullData) {
    return NextResponse.json(
      { error: 'Identity not found' },
      { status: 401 }
    );
  }

  // Create dependencies for userinfo presenter
  const userinfoDeps: UserInfoDeps = {
    getIssuerUrl: () => config.issuer,
    loadPii,
    loadX509,
    loadWebLocale,
    getAgencyUuid,
  };

  // Build the userinfo response
  const userInfo = await buildUserInfo(
    fullData.identity,
    fullData.user,
    fullData.serviceProvider,
    fullData.email,
    userinfoDeps
  );

  return NextResponse.json(userInfo);
}

// Support CORS preflight for userinfo endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
