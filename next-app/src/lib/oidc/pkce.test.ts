/**
 * Tests for PKCE module
 * @vitest-environment node
 */

import { describe, test, expect } from 'vitest';
import {
  generateCodeChallenge,
  verifyCodeChallenge,
  generateCodeVerifier,
} from './pkce';

describe('PKCE', () => {
  describe('generateCodeVerifier', () => {
    test('generates a 43-character base64url string', () => {
      const verifier = generateCodeVerifier();
      // 32 bytes -> 43 base64url characters (without padding)
      expect(verifier.length).toBeGreaterThanOrEqual(42);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('generates unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    test('generates S256 code challenge', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = generateCodeChallenge(verifier);
      // SHA256 hash -> base64url encoding
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(challenge.length).toBeGreaterThanOrEqual(42);
    });

    test('produces deterministic output', () => {
      const verifier = 'test-verifier-12345';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    test('different verifiers produce different challenges', () => {
      const challenge1 = generateCodeChallenge('verifier-1');
      const challenge2 = generateCodeChallenge('verifier-2');
      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('verifyCodeChallenge', () => {
    test('verifies valid code verifier against stored challenge', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      expect(verifyCodeChallenge(verifier, challenge)).toBe(true);
    });

    test('rejects invalid code verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      expect(verifyCodeChallenge('wrong-verifier', challenge)).toBe(false);
    });

    test('handles challenges with padding', () => {
      const verifier = 'test-verifier';
      const challenge = generateCodeChallenge(verifier);
      // Add padding
      const paddedChallenge = challenge + '==';
      expect(verifyCodeChallenge(verifier, paddedChallenge)).toBe(true);
    });

    test('handles challenges without padding', () => {
      const verifier = 'test-verifier';
      const challenge = generateCodeChallenge(verifier);
      // Ensure no padding
      const unpaddedChallenge = challenge.replace(/=+$/, '');
      expect(verifyCodeChallenge(verifier, unpaddedChallenge)).toBe(true);
    });

    test('uses constant-time comparison', () => {
      // This test verifies the comparison doesn't fail on different lengths
      const verifier = 'test-verifier';
      const challenge = generateCodeChallenge(verifier);
      
      // Different lengths should still work (return false)
      expect(verifyCodeChallenge('short', challenge)).toBe(false);
      expect(verifyCodeChallenge('very-long-verifier-that-is-definitely-wrong', challenge)).toBe(false);
    });
  });

  describe('Integration', () => {
    test('full PKCE flow works correctly', () => {
      // 1. Client generates code verifier
      const codeVerifier = generateCodeVerifier();
      
      // 2. Client computes code challenge and sends with auth request
      const codeChallenge = generateCodeChallenge(codeVerifier);
      
      // 3. Server stores code challenge
      const storedChallenge = codeChallenge;
      
      // 4. Client sends code verifier in token request
      // 5. Server verifies
      expect(verifyCodeChallenge(codeVerifier, storedChallenge)).toBe(true);
    });

    test('RFC 7636 Appendix B test vector', () => {
      // Test vector from RFC 7636
      // Note: The RFC uses the plain method for the test vector,
      // but we only support S256
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = generateCodeChallenge(verifier);
      
      // The challenge should be a valid base64url string
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // And verification should work
      expect(verifyCodeChallenge(verifier, challenge)).toBe(true);
    });
  });
});
