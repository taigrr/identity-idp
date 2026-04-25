/**
 * Email Normalizer tests
 * Mirrors: spec/services/email_normalizer_spec.rb
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  normalizeEmailAsync,
  extractEmailParts,
  isValidEmailFormat,
} from './email-normalizer';

describe('normalizeEmail', () => {
  describe('with empty or invalid input', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeEmail('')).toBe('');
    });

    it('returns same string for invalid email', () => {
      expect(normalizeEmail('invalid_email')).toBe('invalid_email');
    });
  });

  describe('with non-gmail domain', () => {
    it('returns the same email unchanged', () => {
      expect(normalizeEmail('foobar+123@example.com')).toBe('foobar+123@example.com');
    });

    it('lowercases the email', () => {
      expect(normalizeEmail('FooBar@Example.COM')).toBe('foobar@example.com');
    });

    it('trims whitespace', () => {
      expect(normalizeEmail('  foo@example.com  ')).toBe('foo@example.com');
    });
  });

  describe('with gmail domain', () => {
    it('removes dots from local part', () => {
      expect(normalizeEmail('foo.bar@gmail.com')).toBe('foobar@gmail.com');
    });

    it('removes everything after + in local part', () => {
      expect(normalizeEmail('foobar+123@gmail.com')).toBe('foobar@gmail.com');
    });

    it('removes dots and + addressing together', () => {
      expect(normalizeEmail('foo.bar+123@gmail.com')).toBe('foobar@gmail.com');
    });

    it('handles multiple dots', () => {
      expect(normalizeEmail('f.o.o.b.a.r@gmail.com')).toBe('foobar@gmail.com');
    });

    it('handles googlemail.com as gmail', () => {
      expect(normalizeEmail('foo.bar+test@googlemail.com')).toBe('foobar@googlemail.com');
    });
  });

  describe('with internationalized domain name', () => {
    it('returns the same email (does not normalize non-ASCII domains)', () => {
      expect(normalizeEmail('test+1@çà.com')).toBe('test+1@çà.com');
    });
  });
});

describe('normalizeEmailAsync', () => {
  it('normalizes gmail addresses without MX check', async () => {
    const result = await normalizeEmailAsync('foo.bar+123@gmail.com');
    expect(result).toBe('foobar@gmail.com');
  });

  it('returns unchanged for non-gmail without MX check', async () => {
    const result = await normalizeEmailAsync('foo.bar+123@example.com');
    expect(result).toBe('foo.bar+123@example.com');
  });

  it('normalizes Google Apps domain when MX check returns true', async () => {
    const result = await normalizeEmailAsync('foo.bar.baz+123@example.com', {
      checkMxRecords: true,
      isGoogleMxRecord: async () => true,
    });
    expect(result).toBe('foobarbaz@example.com');
  });

  it('does not normalize when MX check returns false', async () => {
    const result = await normalizeEmailAsync('foo.bar+123@example.com', {
      checkMxRecords: true,
      isGoogleMxRecord: async () => false,
    });
    expect(result).toBe('foo.bar+123@example.com');
  });

  it('skips MX check when checkMxRecords is false', async () => {
    let mxCheckCalled = false;
    const result = await normalizeEmailAsync('foo.bar+123@example.com', {
      checkMxRecords: false,
      isGoogleMxRecord: async () => {
        mxCheckCalled = true;
        return true;
      },
    });
    expect(result).toBe('foo.bar+123@example.com');
    expect(mxCheckCalled).toBe(false);
  });
});

describe('extractEmailParts', () => {
  it('extracts local and domain parts', () => {
    const parts = extractEmailParts('user@example.com');
    expect(parts).toEqual({ local: 'user', domain: 'example.com' });
  });

  it('returns null for invalid email without @', () => {
    expect(extractEmailParts('invalid')).toBeNull();
  });

  it('returns null for email starting with @', () => {
    expect(extractEmailParts('@example.com')).toBeNull();
  });

  it('returns null for email ending with @', () => {
    expect(extractEmailParts('user@')).toBeNull();
  });

  it('lowercases parts', () => {
    const parts = extractEmailParts('USER@EXAMPLE.COM');
    expect(parts).toEqual({ local: 'user', domain: 'example.com' });
  });

  it('handles multiple @ symbols (uses last one)', () => {
    const parts = extractEmailParts('user@test@example.com');
    expect(parts).toEqual({ local: 'user@test', domain: 'example.com' });
  });
});

describe('isValidEmailFormat', () => {
  it('returns true for valid email', () => {
    expect(isValidEmailFormat('user@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(isValidEmailFormat('user@mail.example.com')).toBe(true);
  });

  it('returns true for email with + addressing', () => {
    expect(isValidEmailFormat('user+tag@example.com')).toBe(true);
  });

  it('returns false for email without @', () => {
    expect(isValidEmailFormat('userexample.com')).toBe(false);
  });

  it('returns false for email without domain', () => {
    expect(isValidEmailFormat('user@')).toBe(false);
  });

  it('returns false for email without TLD', () => {
    expect(isValidEmailFormat('user@example')).toBe(false);
  });

  it('returns false for email with spaces', () => {
    expect(isValidEmailFormat('user @example.com')).toBe(false);
  });
});
