/**
 * Tests for OIDC Scopes Module
 */

import { describe, test, expect } from 'vitest';
import {
  AttributeScoper,
  VALID_SCOPES,
  VALID_IAL1_SCOPES,
  IAL2_SCOPES,
  X509_SCOPES,
  ATTRIBUTE_SCOPES_MAP,
  SCOPE_ATTRIBUTE_MAP,
  CLAIMS,
} from './scopes';

describe('OIDC Scopes', () => {
  describe('Constants', () => {
    test('VALID_SCOPES contains all IAL1 and IAL2 scopes', () => {
      expect(VALID_SCOPES).toContain('email');
      expect(VALID_SCOPES).toContain('openid');
      expect(VALID_SCOPES).toContain('profile');
      expect(VALID_SCOPES).toContain('address');
      expect(VALID_SCOPES).toContain('phone');
    });

    test('VALID_IAL1_SCOPES does not contain IAL2 scopes', () => {
      for (const scope of IAL2_SCOPES) {
        expect(VALID_IAL1_SCOPES).not.toContain(scope);
      }
    });

    test('X509_SCOPES contains certificate scopes', () => {
      expect(X509_SCOPES).toContain('x509');
      expect(X509_SCOPES).toContain('x509:subject');
      expect(X509_SCOPES).toContain('x509:issuer');
      expect(X509_SCOPES).toContain('x509:presented');
    });

    test('ATTRIBUTE_SCOPES_MAP maps attributes to scopes', () => {
      expect(ATTRIBUTE_SCOPES_MAP['email']).toEqual(['email']);
      expect(ATTRIBUTE_SCOPES_MAP['given_name']).toEqual(['profile', 'profile:name']);
      expect(ATTRIBUTE_SCOPES_MAP['birthdate']).toEqual(['profile', 'profile:birthdate']);
    });

    test('SCOPE_ATTRIBUTE_MAP maps scopes to attributes', () => {
      expect(SCOPE_ATTRIBUTE_MAP['email']).toContain('email');
      expect(SCOPE_ATTRIBUTE_MAP['profile']).toContain('given_name');
      expect(SCOPE_ATTRIBUTE_MAP['profile']).toContain('family_name');
      expect(SCOPE_ATTRIBUTE_MAP['profile:name']).toContain('given_name');
    });

    test('CLAIMS contains all attribute names', () => {
      expect(CLAIMS).toContain('email');
      expect(CLAIMS).toContain('given_name');
      expect(CLAIMS).toContain('address');
      expect(CLAIMS).toContain('phone');
    });
  });

  describe('AttributeScoper', () => {
    describe('constructor', () => {
      test('parses space-separated scopes', () => {
        const scoper = new AttributeScoper('openid email profile');
        expect(scoper.getScopes()).toEqual(['openid', 'email', 'profile']);
      });

      test('filters out invalid scopes', () => {
        const scoper = new AttributeScoper('openid invalid_scope email');
        expect(scoper.getScopes()).toEqual(['openid', 'email']);
      });

      test('handles empty scope string', () => {
        const scoper = new AttributeScoper('');
        expect(scoper.getScopes()).toEqual([]);
      });

      test('handles undefined scope', () => {
        const scoper = new AttributeScoper(undefined);
        expect(scoper.getScopes()).toEqual([]);
      });

      test('handles whitespace-only scope', () => {
        const scoper = new AttributeScoper('   ');
        expect(scoper.getScopes()).toEqual([]);
      });
    });

    describe('ial2ScopesRequested', () => {
      test('returns true when IAL2 scopes are present', () => {
        const scoper = new AttributeScoper('openid email address');
        expect(scoper.ial2ScopesRequested()).toBe(true);
      });

      test('returns false when only IAL1 scopes are present', () => {
        const scoper = new AttributeScoper('openid email');
        expect(scoper.ial2ScopesRequested()).toBe(false);
      });
    });

    describe('x509ScopesRequested', () => {
      test('returns true when X509 scopes are present', () => {
        const scoper = new AttributeScoper('openid email x509:subject');
        expect(scoper.x509ScopesRequested()).toBe(true);
      });

      test('returns false when no X509 scopes are present', () => {
        const scoper = new AttributeScoper('openid email profile');
        expect(scoper.x509ScopesRequested()).toBe(false);
      });
    });

    describe('verifiedAtRequested', () => {
      test('returns true when profile:verified_at is present', () => {
        const scoper = new AttributeScoper('openid profile:verified_at');
        expect(scoper.verifiedAtRequested()).toBe(true);
      });

      test('returns true when profile is present', () => {
        const scoper = new AttributeScoper('openid profile');
        expect(scoper.verifiedAtRequested()).toBe(true);
      });

      test('returns false when neither is present', () => {
        const scoper = new AttributeScoper('openid email');
        expect(scoper.verifiedAtRequested()).toBe(false);
      });
    });

    describe('allEmailsRequested', () => {
      test('returns true when all_emails is present', () => {
        const scoper = new AttributeScoper('openid email all_emails');
        expect(scoper.allEmailsRequested()).toBe(true);
      });

      test('returns false when all_emails is not present', () => {
        const scoper = new AttributeScoper('openid email');
        expect(scoper.allEmailsRequested()).toBe(false);
      });
    });

    describe('localeRequested', () => {
      test('returns true when locale is present', () => {
        const scoper = new AttributeScoper('openid locale');
        expect(scoper.localeRequested()).toBe(true);
      });

      test('returns false when locale is not present', () => {
        const scoper = new AttributeScoper('openid email');
        expect(scoper.localeRequested()).toBe(false);
      });
    });

    describe('filter', () => {
      test('includes claims without scope requirements', () => {
        const scoper = new AttributeScoper('openid');
        const userInfo = { sub: '123', iss: 'https://example.com', email: 'test@example.com' };
        const filtered = scoper.filter(userInfo);
        expect(filtered.sub).toBe('123');
        expect(filtered.iss).toBe('https://example.com');
      });

      test('filters out claims when scope not requested', () => {
        const scoper = new AttributeScoper('openid');
        const userInfo = { sub: '123', email: 'test@example.com' };
        const filtered = scoper.filter(userInfo);
        expect(filtered.sub).toBe('123');
        expect(filtered.email).toBeUndefined();
      });

      test('includes claims when scope is requested', () => {
        const scoper = new AttributeScoper('openid email');
        const userInfo = { sub: '123', email: 'test@example.com', email_verified: true };
        const filtered = scoper.filter(userInfo);
        expect(filtered.email).toBe('test@example.com');
        expect(filtered.email_verified).toBe(true);
      });

      test('filters profile attributes based on specific scopes', () => {
        const scoper = new AttributeScoper('openid profile:name');
        const userInfo = {
          sub: '123',
          given_name: 'John',
          family_name: 'Doe',
          birthdate: '1990-01-01',
        };
        const filtered = scoper.filter(userInfo);
        expect(filtered.given_name).toBe('John');
        expect(filtered.family_name).toBe('Doe');
        expect(filtered.birthdate).toBeUndefined();
      });

      test('profile scope includes all profile attributes', () => {
        const scoper = new AttributeScoper('openid profile');
        const userInfo = {
          sub: '123',
          given_name: 'John',
          family_name: 'Doe',
          birthdate: '1990-01-01',
          verified_at: 1234567890,
        };
        const filtered = scoper.filter(userInfo);
        expect(filtered.given_name).toBe('John');
        expect(filtered.family_name).toBe('Doe');
        expect(filtered.birthdate).toBe('1990-01-01');
        expect(filtered.verified_at).toBe(1234567890);
      });
    });

    describe('requestedAttributes', () => {
      test('returns attributes for requested scopes', () => {
        const scoper = new AttributeScoper('email address');
        const attrs = scoper.requestedAttributes();
        expect(attrs).toContain('email');
        expect(attrs).toContain('address');
      });

      test('returns empty array for no scopes', () => {
        const scoper = new AttributeScoper('');
        expect(scoper.requestedAttributes()).toEqual([]);
      });

      test('returns profile attributes for profile scope', () => {
        const scoper = new AttributeScoper('profile');
        const attrs = scoper.requestedAttributes();
        expect(attrs).toContain('given_name');
        expect(attrs).toContain('family_name');
        expect(attrs).toContain('birthdate');
        expect(attrs).toContain('verified_at');
      });
    });
  });
});
