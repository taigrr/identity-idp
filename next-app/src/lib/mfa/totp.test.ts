/**
 * Tests for TOTP service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSecret,
  generateTotpUri,
  verifyTotpCode,
  generateCurrentCode,
  authenticateTotp,
  type TotpConfig,
} from './totp';

describe('TOTP Service', () => {
  describe('generateSecret', () => {
    it('generates a base32 encoded secret', () => {
      const secret = generateSecret();
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it('generates different secrets each time', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateTotpUri', () => {
    it('generates a valid otpauth URI', () => {
      const secret = generateSecret();
      const uri = generateTotpUri(secret, 'user@example.com');

      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('Login.gov');
      expect(uri).toContain('user%40example.com');
      expect(uri).toContain('secret=');
    });

    it('allows custom issuer', () => {
      const secret = generateSecret();
      const uri = generateTotpUri(secret, 'user@example.com', 'CustomApp');

      expect(uri).toContain('CustomApp');
    });
  });

  describe('verifyTotpCode', () => {
    it('verifies a valid current code', () => {
      const secret = generateSecret();
      const code = generateCurrentCode(secret);

      const result = verifyTotpCode(secret, code);
      expect(result).not.toBeNull();
    });

    it('returns null for invalid code', () => {
      const secret = generateSecret();
      const result = verifyTotpCode(secret, '000000');
      expect(result).toBeNull();
    });

    it('rejects codes with wrong format', () => {
      const secret = generateSecret();
      expect(verifyTotpCode(secret, '12345')).toBeNull(); // Too short
      expect(verifyTotpCode(secret, '1234567')).toBeNull(); // Too long
      expect(verifyTotpCode(secret, 'abcdef')).toBeNull(); // Letters
    });

    it('accepts codes with spaces', () => {
      const secret = generateSecret();
      const code = generateCurrentCode(secret);
      const codeWithSpaces = code.slice(0, 3) + ' ' + code.slice(3);

      const result = verifyTotpCode(secret, codeWithSpaces);
      expect(result).not.toBeNull();
    });

    it('prevents replay attacks by checking timestamp', () => {
      const secret = generateSecret();
      const code = generateCurrentCode(secret);

      // First verification succeeds
      const timestamp = verifyTotpCode(secret, code);
      expect(timestamp).not.toBeNull();

      // Same code fails with previous timestamp
      const result = verifyTotpCode(secret, code, timestamp);
      expect(result).toBeNull();
    });
  });

  describe('generateCurrentCode', () => {
    it('generates a 6-digit code', () => {
      const secret = generateSecret();
      const code = generateCurrentCode(secret);

      expect(code).toMatch(/^\d{6}$/);
    });

    it('generates consistent codes for same secret at same time', () => {
      const secret = generateSecret();
      const code1 = generateCurrentCode(secret);
      const code2 = generateCurrentCode(secret);

      expect(code1).toBe(code2);
    });
  });

  describe('authenticateTotp', () => {
    it('returns config when code matches', async () => {
      const secret = generateSecret();
      const code = generateCurrentCode(secret);

      const config: TotpConfig = {
        id: 1,
        userId: 123,
        otpSecretKey: secret,
        name: 'Test App',
        totpTimestamp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateTimestamp = vi.fn();
      const result = await authenticateTotp([config], code, updateTimestamp);

      expect(result).toBe(config);
      expect(updateTimestamp).toHaveBeenCalledWith(1, expect.any(Number));
    });

    it('returns null when no config matches', async () => {
      const config: TotpConfig = {
        id: 1,
        userId: 123,
        otpSecretKey: generateSecret(),
        name: 'Test App',
        totpTimestamp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateTimestamp = vi.fn();
      const result = await authenticateTotp([config], '000000', updateTimestamp);

      expect(result).toBeNull();
      expect(updateTimestamp).not.toHaveBeenCalled();
    });

    it('checks multiple configs and returns first match', async () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      const code = generateCurrentCode(secret2);

      const configs: TotpConfig[] = [
        {
          id: 1,
          userId: 123,
          otpSecretKey: secret1,
          name: 'App 1',
          totpTimestamp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 123,
          otpSecretKey: secret2,
          name: 'App 2',
          totpTimestamp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const updateTimestamp = vi.fn();
      const result = await authenticateTotp(configs, code, updateTimestamp);

      expect(result?.id).toBe(2);
      expect(updateTimestamp).toHaveBeenCalledWith(2, expect.any(Number));
    });
  });
});
