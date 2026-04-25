/**
 * Access Token Verifier
 * Migrated from Rails app/services/access_token_verifier.rb
 * 
 * Validates Bearer tokens for OIDC UserInfo endpoint
 */

export interface ServiceProviderIdentity {
  id: string;
  userId: string;
  serviceProvider: string;
  accessToken: string;
  ial?: number;
  railsSessionId?: string;
  verifiedAt?: Date | null;
}

export interface AccessTokenVerifierDeps {
  findIdentityByAccessToken: (token: string) => Promise<ServiceProviderIdentity | null>;
  getSessionTtl: (sessionId: string) => Promise<number>;
  t: (key: string) => string;
}

export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

export interface AccessTokenVerifierResult {
  success: boolean;
  errors: ValidationError[];
  identity: ServiceProviderIdentity | null;
  extra: {
    clientId?: string;
    ial?: number;
    integrationErrors: {
      errorDetails: string[];
      errorTypes: string[];
      event: string;
      integrationExists: boolean;
      requestIssuer?: string;
    };
  };
}

export async function verifyAccessToken(
  httpAuthorizationHeader: string | null | undefined,
  deps: AccessTokenVerifierDeps
): Promise<AccessTokenVerifierResult> {
  const errors: ValidationError[] = [];
  let identity: ServiceProviderIdentity | null = null;

  const accessToken = extractAccessToken(httpAuthorizationHeader, errors, deps);
  
  if (accessToken && errors.length === 0) {
    identity = await loadIdentity(accessToken, errors, deps);
  }

  return {
    success: errors.length === 0,
    errors,
    identity,
    extra: {
      clientId: identity?.serviceProvider,
      ial: identity?.ial,
      integrationErrors: {
        errorDetails: errors.map(e => e.message),
        errorTypes: errors.map(e => e.type),
        event: 'oidc_bearer_token_auth',
        integrationExists: !!identity?.serviceProvider,
        requestIssuer: identity?.serviceProvider,
      },
    },
  };
}

function extractAccessToken(
  header: string | null | undefined,
  errors: ValidationError[],
  deps: AccessTokenVerifierDeps
): string | null {
  if (!header) {
    errors.push({
      field: 'access_token',
      message: deps.t('openid_connect.user_info.errors.no_authorization'),
      type: 'no_authorization',
    });
    return null;
  }

  const [bearer, accessToken] = header.split(' ', 2);
  
  if (bearer !== 'Bearer' || !accessToken) {
    errors.push({
      field: 'access_token',
      message: deps.t('openid_connect.user_info.errors.malformed_authorization'),
      type: 'malformed_authorization',
    });
    return null;
  }

  return accessToken;
}

async function loadIdentity(
  accessToken: string,
  errors: ValidationError[],
  deps: AccessTokenVerifierDeps
): Promise<ServiceProviderIdentity | null> {
  const identity = await deps.findIdentityByAccessToken(accessToken);

  if (!identity) {
    errors.push({
      field: 'access_token',
      message: deps.t('openid_connect.user_info.errors.not_found'),
      type: 'not_found',
    });
    return null;
  }

  if (identity.railsSessionId) {
    const ttl = await deps.getSessionTtl(identity.railsSessionId);
    if (ttl <= 0) {
      errors.push({
        field: 'access_token',
        message: deps.t('openid_connect.user_info.errors.not_found'),
        type: 'not_found',
      });
      return null;
    }
  }

  return identity;
}

export class AccessTokenVerifier {
  private deps: AccessTokenVerifierDeps;

  constructor(deps: AccessTokenVerifierDeps) {
    this.deps = deps;
  }

  async verify(httpAuthorizationHeader: string | null | undefined): Promise<AccessTokenVerifierResult> {
    return verifyAccessToken(httpAuthorizationHeader, this.deps);
  }
}
