/**
 * OIDC Scope Management
 * Mirrors: app/services/openid_connect_attribute_scoper.rb
 */

// X509 certificate scopes
export const X509_SCOPES = [
  'x509',
  'x509:subject',
  'x509:issuer',
  'x509:presented',
] as const;

// IAL2 (identity proofing) scopes
export const IAL2_SCOPES = [
  'address',
  'phone',
  'profile',
  'profile:name',
  'profile:birthdate',
  'social_security_number',
] as const;

// IAL1 scopes
export const IAL1_ONLY_SCOPES = [
  'email',
  'all_emails',
  'locale',
  'openid',
  'profile:verified_at',
] as const;

// All valid scopes
export const VALID_SCOPES = [
  ...IAL1_ONLY_SCOPES,
  ...X509_SCOPES,
  ...IAL2_SCOPES,
] as const;

// Scopes allowed for IAL1 requests only
export const VALID_IAL1_SCOPES = [...IAL1_ONLY_SCOPES, ...X509_SCOPES] as const;

export type OidcScope = (typeof VALID_SCOPES)[number];

// Mapping from attributes to scopes that grant them
export const ATTRIBUTE_SCOPES_MAP: Record<string, readonly string[]> = {
  email: ['email'],
  email_verified: ['email'],
  all_emails: ['all_emails'],
  locale: ['locale'],
  address: ['address'],
  phone: ['phone'],
  phone_verified: ['phone'],
  given_name: ['profile', 'profile:name'],
  family_name: ['profile', 'profile:name'],
  birthdate: ['profile', 'profile:birthdate'],
  verified_at: ['profile', 'profile:verified_at'],
  social_security_number: ['social_security_number'],
  x509_subject: ['x509', 'x509:subject'],
  x509_presented: ['x509', 'x509:presented'],
  x509_issuer: ['x509', 'x509:issuer'],
} as const;

// Mapping from scopes to attributes they grant
export const SCOPE_ATTRIBUTE_MAP: Record<string, string[]> = {};
for (const [attribute, scopes] of Object.entries(ATTRIBUTE_SCOPES_MAP)) {
  if (attribute.endsWith('_verified')) continue;
  for (const scope of scopes) {
    if (!SCOPE_ATTRIBUTE_MAP[scope]) {
      SCOPE_ATTRIBUTE_MAP[scope] = [];
    }
    SCOPE_ATTRIBUTE_MAP[scope].push(attribute);
  }
}

// Claims that can be returned
export const CLAIMS = Object.keys(ATTRIBUTE_SCOPES_MAP);

/**
 * Attribute scoper - filters user info based on requested scopes
 */
export class AttributeScoper {
  private scopes: string[];

  constructor(scopeString?: string) {
    this.scopes = this.parseScope(scopeString);
  }

  /**
   * Check if any IAL2 scopes were requested
   */
  ial2ScopesRequested(): boolean {
    return this.scopes.some((s) =>
      (IAL2_SCOPES as readonly string[]).includes(s),
    );
  }

  /**
   * Check if any X509 scopes were requested
   */
  x509ScopesRequested(): boolean {
    return this.scopes.some((s) =>
      (X509_SCOPES as readonly string[]).includes(s),
    );
  }

  /**
   * Check if verified_at was requested
   */
  verifiedAtRequested(): boolean {
    return (
      this.scopes.includes('profile:verified_at') ||
      this.scopes.includes('profile')
    );
  }

  /**
   * Check if all_emails was requested
   */
  allEmailsRequested(): boolean {
    return this.scopes.includes('all_emails');
  }

  /**
   * Check if locale was requested
   */
  localeRequested(): boolean {
    return this.scopes.includes('locale');
  }

  /**
   * Filter user info based on requested scopes
   */
  filter<T extends Record<string, unknown>>(userInfo: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(userInfo)) {
      const allowedScopes = ATTRIBUTE_SCOPES_MAP[key];
      // Include if no scope mapping exists (e.g., sub, iss) or if scope was requested
      if (!allowedScopes || this.scopes.some((s) => allowedScopes.includes(s))) {
        result[key as keyof T] = value as T[keyof T];
      }
    }
    return result;
  }

  /**
   * Get list of attributes that can be returned based on scopes
   */
  requestedAttributes(): string[] {
    return this.scopes.flatMap((scope) => SCOPE_ATTRIBUTE_MAP[scope] ?? []);
  }

  /**
   * Get the parsed scopes
   */
  getScopes(): string[] {
    return this.scopes;
  }

  private parseScope(scope?: string): string[] {
    if (!scope?.trim()) return [];
    return scope
      .split(' ')
      .filter((s) => s && (VALID_SCOPES as readonly string[]).includes(s));
  }
}
