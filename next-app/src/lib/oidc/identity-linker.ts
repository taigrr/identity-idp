/**
 * Identity Linker
 * Migrated from Rails app/services/identity_linker.rb
 * 
 * Links user identities to service providers during OIDC/SAML flows.
 */

import { randomBytes, randomUUID } from 'crypto';

export interface User {
  id: string;
}

export interface ServiceProvider {
  issuer: string;
}

export interface ServiceProviderIdentity {
  id?: string;
  userId: string;
  serviceProvider: string;
  accessToken?: string;
  sessionUuid?: string;
  ial?: number;
  aal?: number;
  acrValues?: string | null;
  vtr?: string | null;
  requestedAalValue?: string | null;
  nonce?: string | null;
  railsSessionId?: string | null;
  scope?: string | null;
  codeChallenge?: string | null;
  verifiedAttributes?: string[];
  lastConsentedAt?: Date | null;
  lastAuthenticatedAt?: Date | null;
  lastIal1AuthenticatedAt?: Date | null;
  lastIal2AuthenticatedAt?: Date | null;
  verifiedAt?: Date | null;
  deletedAt?: Date | null;
  emailAddressId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LinkIdentityOptions {
  codeChallenge?: string | null;
  ial?: number | null;
  aal?: number | null;
  acrValues?: string | null;
  vtr?: string | null;
  requestedAalValue?: string | null;
  nonce?: string | null;
  railsSessionId?: string | null;
  scope?: string | null;
  verifiedAttributes?: string[] | null;
  lastConsentedAt?: Date | null;
  clearDeletedAt?: boolean;
  emailAddressId?: string | null;
}

export interface IdentityLinkerDeps {
  findOrCreateIdentity: (
    userId: string,
    serviceProviderIssuer: string
  ) => Promise<ServiceProviderIdentity>;
  updateIdentity: (
    identityId: string,
    data: Partial<ServiceProviderIdentity>
  ) => Promise<ServiceProviderIdentity>;
  linkAgencyIdentity?: (identity: ServiceProviderIdentity) => Promise<void>;
}

export const IAL2 = 2;
export const IAL1 = 1;

export class IdentityLinker {
  private user: User;
  private serviceProvider: ServiceProvider;
  private deps: IdentityLinkerDeps;
  private identity?: ServiceProviderIdentity;

  constructor(
    user: User,
    serviceProvider: ServiceProvider,
    deps: IdentityLinkerDeps
  ) {
    this.user = user;
    this.serviceProvider = serviceProvider;
    this.deps = deps;
  }

  async linkIdentity(options: LinkIdentityOptions = {}): Promise<ServiceProviderIdentity | null> {
    if (!this.user || !this.serviceProvider) {
      return null;
    }

    const identity = await this.getIdentity();
    const now = new Date();

    const updateData: Partial<ServiceProviderIdentity> = {
      codeChallenge: options.codeChallenge ?? null,
      ial: options.ial ?? undefined,
      aal: options.aal ?? undefined,
      acrValues: options.acrValues ?? null,
      vtr: null,
      requestedAalValue: options.requestedAalValue ?? null,
      nonce: options.nonce ?? null,
      railsSessionId: options.railsSessionId ?? null,
      scope: options.scope ?? null,
      verifiedAttributes: this.combineVerifiedAttributes(
        identity.verifiedAttributes ?? [],
        options.verifiedAttributes ?? []
      ),
      emailAddressId: options.emailAddressId ?? null,
      lastAuthenticatedAt: now,
      sessionUuid: randomUUID(),
      accessToken: randomBytes(32).toString('base64url'),
    };

    if (options.lastConsentedAt) {
      updateData.lastConsentedAt = options.lastConsentedAt;
    }

    if (options.clearDeletedAt) {
      updateData.deletedAt = null;
    }

    this.processIal(options.ial ?? null, identity, updateData, now);

    const updatedIdentity = await this.deps.updateIdentity(identity.id!, updateData);

    if (this.deps.linkAgencyIdentity) {
      await this.deps.linkAgencyIdentity(updatedIdentity);
    }

    return updatedIdentity;
  }

  private async getIdentity(): Promise<ServiceProviderIdentity> {
    if (!this.identity) {
      this.identity = await this.deps.findOrCreateIdentity(
        this.user.id,
        this.serviceProvider.issuer
      );
    }
    return this.identity;
  }

  private processIal(
    ial: number | null,
    identity: ServiceProviderIdentity,
    updateData: Partial<ServiceProviderIdentity>,
    now: Date
  ): void {
    if (ial === IAL2 || (identity.verifiedAt && ial === 0)) {
      updateData.lastIal2AuthenticatedAt = now;
    } else {
      updateData.lastIal1AuthenticatedAt = now;
    }

    if (ial === IAL2 && !identity.verifiedAt) {
      updateData.verifiedAt = now;
    }
  }

  private combineVerifiedAttributes(
    existing: string[],
    newAttrs: string[]
  ): string[] {
    const combined = new Set([...existing, ...newAttrs.map(String)]);
    return Array.from(combined).sort();
  }
}

export function createIdentityLinker(
  user: User,
  serviceProvider: ServiceProvider,
  deps: IdentityLinkerDeps
): IdentityLinker {
  return new IdentityLinker(user, serviceProvider, deps);
}
