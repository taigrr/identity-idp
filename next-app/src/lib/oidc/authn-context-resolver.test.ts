/**
 * AuthnContext Resolver tests
 * Mirrors: spec/services/authn_context_resolver_spec.rb
 */

import { describe, it, expect } from 'vitest';
import {
  AuthnContextResolver,
  parseAcrValues,
  createAuthnContextResolver,
} from './authn-context-resolver';
import { ACR_VALUES } from './constants';

describe('parseAcrValues', () => {
  it('returns empty result for null input', () => {
    const result = parseAcrValues(null);
    expect(result.aal2).toBe(false);
    expect(result.identityProofing).toBe(false);
    expect(result.componentValues).toEqual([]);
  });

  it('returns empty result for undefined input', () => {
    const result = parseAcrValues(undefined);
    expect(result.aal2).toBe(false);
  });

  it('parses AAL2 ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.AAL2);
    expect(result.aal2).toBe(true);
    expect(result.phishingResistant).toBe(false);
    expect(result.hspd12).toBe(false);
  });

  it('parses AAL2 phishing resistant ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.AAL2_PHISHING_RESISTANT);
    expect(result.aal2).toBe(true);
    expect(result.phishingResistant).toBe(true);
  });

  it('parses AAL2 HSPD12 ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.AAL2_HSPD12);
    expect(result.aal2).toBe(true);
    expect(result.hspd12).toBe(true);
  });

  it('parses IAL2 ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.IAL2);
    expect(result.identityProofing).toBe(true);
  });

  it('parses IAL MAX ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.IAL_MAX);
    expect(result.ialmax).toBe(true);
  });

  it('parses facial match ACR value', () => {
    const result = parseAcrValues(ACR_VALUES.IAL2_BIO_REQUIRED);
    expect(result.facialMatch).toBe(true);
    expect(result.identityProofing).toBe(true);
  });

  it('parses multiple space-separated ACR values', () => {
    const result = parseAcrValues(`${ACR_VALUES.AAL2} ${ACR_VALUES.IAL2}`);
    expect(result.aal2).toBe(true);
    expect(result.identityProofing).toBe(true);
    expect(result.componentValues).toHaveLength(2);
  });

  it('tracks component values and names', () => {
    const result = parseAcrValues(`${ACR_VALUES.AAL2} ${ACR_VALUES.IAL2}`);
    expect(result.componentNames).toContain(ACR_VALUES.AAL2);
    expect(result.componentNames).toContain(ACR_VALUES.IAL2);
    expect(result.componentValues).toEqual([
      { name: ACR_VALUES.AAL2 },
      { name: ACR_VALUES.IAL2 },
    ]);
  });
});

describe('AuthnContextResolver', () => {
  describe('result', () => {
    it('returns parsed ACR values', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: ACR_VALUES.AAL2,
      });

      expect(resolver.result.aal2).toBe(true);
    });

    it('applies service provider AAL defaults when no AAL in ACR', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: { issuer: 'test', defaultAal: 2 },
        acrValues: ACR_VALUES.IAL1,
      });

      expect(resolver.result.aal2).toBe(true);
    });

    it('does not override explicit AAL in ACR with SP defaults', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: { issuer: 'test', defaultAal: 2 },
        acrValues: ACR_VALUES.AAL1,
      });

      expect(resolver.result.aal2).toBe(false);
    });

    it('applies service provider IAL defaults when no IAL in ACR', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: { issuer: 'test', identityProofingAllowed: true },
        acrValues: ACR_VALUES.AAL1,
      });

      expect(resolver.result.identityProofing).toBe(true);
      expect(resolver.result.aal2).toBe(true);
    });

    it('sets phishing resistant for AAL3 default', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: { issuer: 'test', defaultAal: 3 },
        acrValues: null,
      });

      expect(resolver.result.aal2).toBe(true);
      expect(resolver.result.phishingResistant).toBe(true);
    });
  });

  describe('assertedIalAcr', () => {
    it('returns IAL1 for unverified user', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: false },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL2,
      });

      expect(resolver.assertedIalAcr).toBe(ACR_VALUES.IAL1);
    });

    it('returns IAL2 for verified user with identity proofing', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL2,
      });

      expect(resolver.assertedIalAcr).toBe(ACR_VALUES.IAL2);
    });

    it('returns IAL1 for verified user without identity proofing requested', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true },
        serviceProvider: null,
        acrValues: ACR_VALUES.AAL2,
      });

      expect(resolver.assertedIalAcr).toBe(ACR_VALUES.IAL1);
    });

    it('returns IAL2 bio required for facial match', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true, identityVerifiedWithFacialMatch: true },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL2_BIO_REQUIRED,
      });

      expect(resolver.assertedIalAcr).toBe(ACR_VALUES.IAL2_BIO_REQUIRED);
    });
  });

  describe('assertedAalAcr', () => {
    it('returns AAL1 by default', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: null,
      });

      expect(resolver.assertedAalAcr).toBe(ACR_VALUES.AAL1);
    });

    it('returns AAL2 when requested', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: ACR_VALUES.AAL2,
      });

      expect(resolver.assertedAalAcr).toBe(ACR_VALUES.AAL2);
    });

    it('returns AAL2 HSPD12 when requested', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: ACR_VALUES.AAL2_HSPD12,
      });

      expect(resolver.assertedAalAcr).toBe(ACR_VALUES.AAL2_HSPD12);
    });

    it('returns AAL2 phishing resistant when requested', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: ACR_VALUES.AAL2_PHISHING_RESISTANT,
      });

      expect(resolver.assertedAalAcr).toBe(ACR_VALUES.AAL2_PHISHING_RESISTANT);
    });

    it('prioritizes HSPD12 over phishing resistant', () => {
      const resolver = new AuthnContextResolver({
        user: null,
        serviceProvider: null,
        acrValues: `${ACR_VALUES.AAL2_HSPD12} ${ACR_VALUES.AAL2_PHISHING_RESISTANT}`,
      });

      expect(resolver.assertedAalAcr).toBe(ACR_VALUES.AAL2_HSPD12);
    });
  });

  describe('facial match user context decoration', () => {
    it('removes facial match requirement for already verified user', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true, identityVerifiedWithFacialMatch: false },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED,
      });

      expect(resolver.result.facialMatch).toBe(false);
    });

    it('keeps facial match for user verified with facial match', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true, identityVerifiedWithFacialMatch: true },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED,
      });

      expect(resolver.result.facialMatch).toBe(true);
    });

    it('keeps facial match for required context even if user verified without it', () => {
      const resolver = new AuthnContextResolver({
        user: { id: '1', identityVerified: true, identityVerifiedWithFacialMatch: false },
        serviceProvider: null,
        acrValues: ACR_VALUES.IAL2_BIO_REQUIRED,
      });

      expect(resolver.result.facialMatch).toBe(true);
    });
  });
});

describe('createAuthnContextResolver', () => {
  it('creates resolver instance', () => {
    const resolver = createAuthnContextResolver({
      user: null,
      serviceProvider: null,
      acrValues: ACR_VALUES.AAL2,
    });

    expect(resolver).toBeInstanceOf(AuthnContextResolver);
    expect(resolver.result.aal2).toBe(true);
  });
});
