/**
 * UserInfo Endpoint
 * /api/openid-connect/userinfo
 * Mirrors: app/controllers/openid_connect/user_info_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import { AttributeScoper, getOidcConfig } from '@/lib/oidc';

interface ServiceProviderIdentity {
  id: string;
  userId: string;
  serviceProvider: string;
  scope: string;
  ial: number;
  acr_values: string | null;
  requestedAalValue: string | null;
  railsSessionId: string;
  pivCacEnabled: boolean;
  emailAddress: {
    email: string;
  };
  user: {
    uuid: string;
    confirmedEmailAddresses: { email: string }[];
    activeProfile: {
      id: string;
      verifiedAt: Date | null;
    } | null;
    identityVerified: boolean;
  };
}

interface UserInfo {
  sub: string;
  iss: string;
  email?: string;
  email_verified?: boolean;
  all_emails?: string[];
  locale?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  address?: {
    formatted: string;
    street_address: string;
    locality: string;
    region: string;
    postal_code: string;
  };
  phone?: string;
  phone_verified?: boolean;
  social_security_number?: string;
  verified_at?: number;
  ial?: string;
  aal?: string;
  x509_subject?: string;
  x509_issuer?: string;
  x509_presented?: boolean;
}

// In a real implementation, these would come from the database
async function findIdentityByAccessToken(
  accessToken: string,
): Promise<ServiceProviderIdentity | null> {
  // TODO: Replace with actual database lookup
  // ServiceProviderIdentity.find_by(access_token: accessToken)
  console.log('Looking up identity by access token:', accessToken?.slice(0, 8) + '...');
  return null;
}

async function getSessionTtl(railsSessionId: string): Promise<number> {
  // TODO: Replace with actual Redis lookup
  // OutOfBandSessionAccessor.new(rails_session_id).ttl
  const config = getOidcConfig();
  return config.tokenTtl;
}

async function loadPii(
  profileId: string,
): Promise<{
  firstName?: string;
  lastName?: string;
  dob?: string;
  ssn?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
} | null> {
  // TODO: Replace with actual PII lookup from session/encrypted storage
  console.log('Loading PII for profile:', profileId);
  return null;
}

async function loadX509Data(
  railsSessionId: string,
): Promise<{
  subject?: string;
  issuer?: string;
  presented?: boolean;
} | null> {
  // TODO: Replace with actual X509 data lookup
  console.log('Loading X509 data for session:', railsSessionId);
  return null;
}

async function loadWebLocale(railsSessionId: string): Promise<string | null> {
  // TODO: Replace with actual locale lookup from session
  console.log('Loading locale for session:', railsSessionId);
  return null;
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

export async function GET(request: NextRequest) {
  const config = getOidcConfig();

  // Extract bearer token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const accessToken = extractBearerToken(authHeader);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No authorization header' },
      { status: 401 },
    );
  }

  // Find identity by access token
  const identity = await findIdentityByAccessToken(accessToken);

  if (!identity) {
    return NextResponse.json(
      { error: 'Invalid access token' },
      { status: 401 },
    );
  }

  // Check if session is still valid
  const ttl = await getSessionTtl(identity.railsSessionId);
  if (ttl <= 0) {
    return NextResponse.json(
      { error: 'Session expired' },
      { status: 401 },
    );
  }

  // Build user info based on requested scopes
  const scoper = new AttributeScoper(identity.scope);

  const userInfo: UserInfo = {
    sub: identity.user.uuid,
    iss: config.issuer,
    email: identity.emailAddress.email,
    email_verified: true,
    ial: identity.acr_values ?? undefined,
    aal: identity.requestedAalValue ?? undefined,
  };

  // Add all_emails if requested
  if (scoper.allEmailsRequested()) {
    userInfo.all_emails = identity.user.confirmedEmailAddresses.map((e) => e.email);
  }

  // Add locale if requested
  if (scoper.localeRequested()) {
    const locale = await loadWebLocale(identity.railsSessionId);
    if (locale) {
      userInfo.locale = locale;
    }
  }

  // Add IAL2 attributes if identity proofing was requested and user is verified
  const isIal2Request = identity.ial === 2 || identity.ial === 0; // 0 = IALMAX
  const hasActiveProfile = identity.user.activeProfile !== null;

  if (isIal2Request && hasActiveProfile && scoper.ial2ScopesRequested()) {
    const pii = await loadPii(identity.user.activeProfile!.id);
    if (pii) {
      if (pii.firstName) userInfo.given_name = pii.firstName;
      if (pii.lastName) userInfo.family_name = pii.lastName;
      if (pii.dob) userInfo.birthdate = pii.dob;
      if (pii.ssn) userInfo.social_security_number = pii.ssn;
      if (pii.phone) {
        userInfo.phone = pii.phone;
        userInfo.phone_verified = true;
      }
      if (pii.address1) {
        const streetAddress = [pii.address1, pii.address2]
          .filter(Boolean)
          .join('\n');
        const postalCode = pii.zipcode?.trim().slice(0, 5);
        userInfo.address = {
          formatted: `${streetAddress}\n${pii.city}, ${pii.state} ${postalCode}`,
          street_address: streetAddress,
          locality: pii.city ?? '',
          region: pii.state ?? '',
          postal_code: postalCode ?? '',
        };
      }
    }

    // Add verified_at if requested and available
    if (scoper.verifiedAtRequested() && identity.user.activeProfile?.verifiedAt) {
      userInfo.verified_at = Math.floor(
        identity.user.activeProfile.verifiedAt.getTime() / 1000,
      );
    }
  }

  // Add X509 attributes if requested and PIV/CAC was used
  if (scoper.x509ScopesRequested() && identity.pivCacEnabled) {
    const x509Data = await loadX509Data(identity.railsSessionId);
    if (x509Data) {
      if (x509Data.subject) userInfo.x509_subject = x509Data.subject;
      if (x509Data.issuer) userInfo.x509_issuer = x509Data.issuer;
      userInfo.x509_presented = x509Data.presented ?? false;
    }
  }

  // Filter user info based on requested scopes
  const filteredUserInfo = scoper.filter(userInfo);

  return NextResponse.json(filteredUserInfo);
}
