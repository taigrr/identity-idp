/**
 * OIDC UserInfo Presenter
 * Migrated from Rails app/presenters/openid_connect_user_info_presenter.rb
 *
 * Builds the UserInfo response based on the identity's scope and user data.
 */

import { AttributeScoper } from './scopes';
import { AuthnContextResolver } from './authn-context-resolver';

export interface UserInfoIdentity {
  id: string;
  uuid: string;
  userId: string;
  serviceProvider: string;
  scope: string;
  ial: number | null;
  aal: number | null;
  acrValues: string | null;
  requestedAalValue: string | null;
  railsSessionId: string | null;
  verifiedAt: Date | null;
  emailAddressId: string | null;
}

export interface UserInfoUser {
  id: string;
  uuid: string;
  confirmedEmailAddresses: { email: string }[];
  activeProfile: {
    id: string;
    verifiedAt: Date | null;
  } | null;
}

export interface UserInfoServiceProvider {
  issuer: string;
  ial: number | null;
  defaultAalValue: string | null;
}

export interface UserInfoPii {
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
}

export interface UserInfoX509 {
  subject?: string;
  issuer?: string;
  presented?: boolean;
}

export interface UserInfoDeps {
  getIssuerUrl: () => string;
  loadPii: (profileId: string) => Promise<UserInfoPii | null>;
  loadX509: (sessionId: string) => Promise<UserInfoX509 | null>;
  loadWebLocale: (sessionId: string) => Promise<string | null>;
  getAgencyUuid: (identity: UserInfoIdentity) => Promise<string>;
}

export interface UserInfoResponse {
  sub: string;
  iss: string;
  email: string;
  email_verified: boolean;
  all_emails?: string[];
  locale?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  social_security_number?: string;
  address?: {
    formatted: string;
    street_address: string;
    locality: string;
    region: string;
    postal_code: string;
  };
  phone?: string;
  phone_verified?: boolean;
  verified_at?: number;
  ial?: string;
  aal?: string;
  x509_subject?: string;
  x509_issuer?: string;
  x509_presented?: boolean;
}

export class UserInfoPresenter {
  private identity: UserInfoIdentity;
  private user: UserInfoUser;
  private serviceProvider: UserInfoServiceProvider | null;
  private email: string;
  private deps: UserInfoDeps;
  private scoper: AttributeScoper;
  private authnContextResolver: AuthnContextResolver | null = null;

  constructor(
    identity: UserInfoIdentity,
    user: UserInfoUser,
    serviceProvider: UserInfoServiceProvider | null,
    email: string,
    deps: UserInfoDeps
  ) {
    this.identity = identity;
    this.user = user;
    this.serviceProvider = serviceProvider;
    this.email = email;
    this.deps = deps;
    this.scoper = new AttributeScoper(identity.scope);
  }

  async buildUserInfo(): Promise<Record<string, unknown>> {
    const info: UserInfoResponse = {
      sub: await this.deps.getAgencyUuid(this.identity),
      iss: this.deps.getIssuerUrl(),
      email: this.email,
      email_verified: true,
    };

    // Add all_emails if requested
    if (this.scoper.allEmailsRequested()) {
      info.all_emails = this.user.confirmedEmailAddresses.map((e) => e.email);
    }

    // Add locale if requested
    if (this.scoper.localeRequested() && this.identity.railsSessionId) {
      const locale = await this.deps.loadWebLocale(this.identity.railsSessionId);
      if (locale) {
        info.locale = locale;
      }
    }

    // Add IAL2 attributes if identity proofing was requested and user is verified
    if (await this.identityProofingRequestedForVerifiedUser()) {
      const ial2Attrs = await this.buildIal2Attributes();
      Object.assign(info, ial2Attrs);
    }

    // Add X509 attributes if requested
    if (this.scoper.x509ScopesRequested() && this.identity.railsSessionId) {
      const x509Attrs = await this.buildX509Attributes();
      Object.assign(info, x509Attrs);
    }

    // Add verified_at if requested
    if (this.scoper.verifiedAtRequested()) {
      const verifiedAt = this.getVerifiedAt();
      if (verifiedAt !== null) {
        info.verified_at = verifiedAt;
      }
    }

    // Add IAL and AAL
    const resolver = this.getAuthnContextResolver();
    info.ial = resolver.assertedIalAcr;
    info.aal = this.identity.requestedAalValue ?? undefined;

    // Filter based on requested scopes
    return this.scoper.filter(info as unknown as Record<string, unknown>);
  }

  private async identityProofingRequestedForVerifiedUser(): Promise<boolean> {
    if (!this.user.activeProfile) {
      return false;
    }

    const resolver = this.getAuthnContextResolver();
    const result = resolver.result;
    return result.identityProofing || result.ialmax;
  }

  private getAuthnContextResolver(): AuthnContextResolver {
    if (!this.authnContextResolver) {
      this.authnContextResolver = new AuthnContextResolver({
        user: {
          id: this.user.id,
          identityVerified: !!this.user.activeProfile?.verifiedAt,
        },
        serviceProvider: this.serviceProvider ? {
          issuer: this.serviceProvider.issuer,
          defaultAal: this.serviceProvider.ial ?? undefined,
        } : undefined,
        acrValues: this.identity.acrValues ?? undefined,
      });
    }
    return this.authnContextResolver;
  }

  private async buildIal2Attributes(): Promise<Partial<UserInfoResponse>> {
    const attrs: Partial<UserInfoResponse> = {};

    if (!this.user.activeProfile || !this.identity.railsSessionId) {
      return attrs;
    }

    const pii = await this.deps.loadPii(this.user.activeProfile.id);
    if (!pii) {
      return attrs;
    }

    if (pii.firstName) attrs.given_name = pii.firstName;
    if (pii.lastName) attrs.family_name = pii.lastName;
    if (pii.dob) attrs.birthdate = this.formatDob(pii.dob);
    if (pii.ssn) attrs.social_security_number = pii.ssn;

    if (pii.phone) {
      attrs.phone = this.formatPhone(pii.phone);
      attrs.phone_verified = true;
    }

    if (pii.address1) {
      const streetAddress = [pii.address1, pii.address2].filter(Boolean).join('\n');
      const postalCode = pii.zipcode?.trim().slice(0, 5) ?? '';
      attrs.address = {
        formatted: `${streetAddress}\n${pii.city}, ${pii.state} ${postalCode}`,
        street_address: streetAddress,
        locality: pii.city ?? '',
        region: pii.state ?? '',
        postal_code: postalCode,
      };
    }

    return attrs;
  }

  private async buildX509Attributes(): Promise<Partial<UserInfoResponse>> {
    const attrs: Partial<UserInfoResponse> = {};

    if (!this.identity.railsSessionId) {
      return attrs;
    }

    const x509 = await this.deps.loadX509(this.identity.railsSessionId);
    if (!x509) {
      return attrs;
    }

    if (x509.subject) attrs.x509_subject = x509.subject;
    if (x509.issuer) attrs.x509_issuer = x509.issuer;
    attrs.x509_presented = x509.presented ?? false;

    return attrs;
  }

  private getVerifiedAt(): number | null {
    if (!this.serviceProvider || (this.serviceProvider.ial ?? 0) < 2) {
      return null;
    }

    const verifiedAt = this.user.activeProfile?.verifiedAt;
    if (!verifiedAt) {
      return null;
    }

    return Math.floor(verifiedAt.getTime() / 1000);
  }

  private formatDob(dob: string): string {
    // Return as-is if already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return dob;
    }

    // Try to parse and format
    const date = new Date(dob);
    if (isNaN(date.getTime())) {
      return dob;
    }

    return date.toISOString().split('T')[0];
  }

  private formatPhone(phone: string): string {
    // Simple E.164 formatting - should use libphonenumber in production
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return phone;
  }
}

export async function buildUserInfo(
  identity: UserInfoIdentity,
  user: UserInfoUser,
  serviceProvider: UserInfoServiceProvider | null,
  email: string,
  deps: UserInfoDeps
): Promise<Record<string, unknown>> {
  const presenter = new UserInfoPresenter(identity, user, serviceProvider, email, deps);
  return presenter.buildUserInfo();
}
