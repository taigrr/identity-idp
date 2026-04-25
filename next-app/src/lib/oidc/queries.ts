/**
 * OIDC Database Queries
 * Database operations for OIDC endpoints
 *
 * Mirrors queries from:
 * - app/forms/openid_connect_token_form.rb
 * - app/presenters/openid_connect_user_info_presenter.rb
 */

import { eq, desc, and } from 'drizzle-orm';
import type { Database } from '@/db';
import { identities, users, emailAddresses, serviceProviders } from '@/db';

/**
 * Identity with user and email data for token endpoint
 */
export interface TokenIdentity {
  id: number;
  userId: number | null;
  serviceProvider: string | null;
  sessionUuid: string | null;
  accessToken: string | null;
  nonce: string | null;
  scope: string | null;
  codeChallenge: string | null;
  acrValues: string | null;
  ial: number | null;
  requestedAalValue: string | null;
  updatedAt: Date | null;
  railsSessionId: string | null;
  emailAddressId: number | null;
  user: {
    id: number;
    uuid: string;
  } | null;
  emailAddress: {
    id: number;
    encryptedEmail: string;
  } | null;
}

/**
 * Identity with full data for userinfo endpoint
 */
export interface UserInfoIdentity {
  id: number;
  userId: number | null;
  serviceProvider: string | null;
  accessToken: string | null;
  scope: string | null;
  acrValues: string | null;
  vtr: string | null;
  ial: number | null;
  aal: number | null;
  verifiedAttributes: unknown;
  verifiedAt: Date | null;
  railsSessionId: string | null;
  emailAddressId: number | null;
  user: {
    id: number;
    uuid: string;
  } | null;
  emailAddress: {
    id: number;
    encryptedEmail: string;
  } | null;
}

/**
 * Service provider data
 */
export interface ServiceProviderData {
  id: number;
  issuer: string;
  pkce: boolean | null;
  certs: string[] | null;
  ial: number | null;
}

/**
 * Find identity by authorization code (session_uuid)
 * Mirrors: ServiceProviderIdentity.where(session_uuid: code).order(updated_at: :desc).first
 */
export async function findIdentityByCode(
  db: Database,
  code: string,
): Promise<TokenIdentity | null> {
  const results = await db
    .select({
      id: identities.id,
      userId: identities.userId,
      serviceProvider: identities.serviceProvider,
      sessionUuid: identities.sessionUuid,
      accessToken: identities.accessToken,
      nonce: identities.nonce,
      scope: identities.scope,
      codeChallenge: identities.codeChallenge,
      acrValues: identities.acrValues,
      ial: identities.ial,
      requestedAalValue: identities.requestedAalValue,
      updatedAt: identities.updatedAt,
      railsSessionId: identities.railsSessionId,
      emailAddressId: identities.emailAddressId,
      user: {
        id: users.id,
        uuid: users.uuid,
      },
    })
    .from(identities)
    .leftJoin(users, eq(identities.userId, users.id))
    .where(eq(identities.sessionUuid, code))
    .orderBy(desc(identities.updatedAt))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const result = results[0];

  // Load email address if needed
  let emailAddress: { id: number; encryptedEmail: string } | null = null;
  if (result.emailAddressId) {
    const emailResults = await db
      .select({
        id: emailAddresses.id,
        encryptedEmail: emailAddresses.encryptedEmail,
      })
      .from(emailAddresses)
      .where(eq(emailAddresses.id, result.emailAddressId))
      .limit(1);

    if (emailResults.length > 0) {
      emailAddress = emailResults[0];
    }
  }

  return {
    ...result,
    emailAddress,
  };
}

/**
 * Find identity by access token
 * Mirrors: ServiceProviderIdentity.find_by(access_token: access_token)
 */
export async function findIdentityByAccessToken(
  db: Database,
  accessToken: string,
): Promise<UserInfoIdentity | null> {
  const results = await db
    .select({
      id: identities.id,
      userId: identities.userId,
      serviceProvider: identities.serviceProvider,
      accessToken: identities.accessToken,
      scope: identities.scope,
      acrValues: identities.acrValues,
      vtr: identities.vtr,
      ial: identities.ial,
      aal: identities.aal,
      verifiedAttributes: identities.verifiedAttributes,
      verifiedAt: identities.verifiedAt,
      railsSessionId: identities.railsSessionId,
      emailAddressId: identities.emailAddressId,
      user: {
        id: users.id,
        uuid: users.uuid,
      },
    })
    .from(identities)
    .leftJoin(users, eq(identities.userId, users.id))
    .where(eq(identities.accessToken, accessToken))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const result = results[0];

  // Load email address if needed
  let emailAddress: { id: number; encryptedEmail: string } | null = null;
  if (result.emailAddressId) {
    const emailResults = await db
      .select({
        id: emailAddresses.id,
        encryptedEmail: emailAddresses.encryptedEmail,
      })
      .from(emailAddresses)
      .where(eq(emailAddresses.id, result.emailAddressId))
      .limit(1);

    if (emailResults.length > 0) {
      emailAddress = emailResults[0];
    }
  }

  return {
    ...result,
    emailAddress,
  };
}

/**
 * Find service provider by issuer
 * Mirrors: ServiceProvider.find_by(issuer: issuer)
 */
export async function findServiceProvider(
  db: Database,
  issuer: string,
): Promise<ServiceProviderData | null> {
  const results = await db
    .select({
      id: serviceProviders.id,
      issuer: serviceProviders.issuer,
      pkce: serviceProviders.pkce,
      certs: serviceProviders.certs,
      ial: serviceProviders.ial,
    })
    .from(serviceProviders)
    .where(
      and(
        eq(serviceProviders.issuer, issuer),
        eq(serviceProviders.active, true),
      ),
    )
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return results[0];
}

/**
 * Clear authorization code (single use)
 * Mirrors: identity.update(session_uuid: nil)
 */
export async function clearAuthorizationCode(
  db: Database,
  identityId: number,
): Promise<void> {
  await db
    .update(identities)
    .set({ sessionUuid: null })
    .where(eq(identities.id, identityId));
}

/**
 * Create database query functions bound to a database instance
 * Used for dependency injection in routes
 */
export function createOidcQueries(db: Database) {
  return {
    findIdentityByCode: (code: string) => findIdentityByCode(db, code),
    findIdentityByAccessToken: (token: string) => findIdentityByAccessToken(db, token),
    findServiceProvider: (issuer: string) => findServiceProvider(db, issuer),
    clearAuthorizationCode: (identityId: number) => clearAuthorizationCode(db, identityId),
  };
}

export type OidcQueries = ReturnType<typeof createOidcQueries>;
