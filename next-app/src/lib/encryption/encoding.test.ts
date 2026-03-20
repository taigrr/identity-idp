/**
 * Tests for encoding utilities
 */

import { describe, it, expect } from 'vitest';
import { encode, decode, isValidBase64 } from './encoding';

describe('Encoding', () => {
  describe('encode', () => {
    it('encodes buffer to base64 string', () => {
      const buffer = Buffer.from('Hello, World!');
      const encoded = encode(buffer);
      expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('encodes Uint8Array to base64 string', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]);
      const encoded = encode(data);
      expect(encoded).toBe('SGVsbG8=');
    });

    it('encodes empty buffer', () => {
      const buffer = Buffer.from('');
      const encoded = encode(buffer);
      expect(encoded).toBe('');
    });
  });

  describe('decode', () => {
    it('decodes base64 string to buffer', () => {
      const encoded = 'SGVsbG8sIFdvcmxkIQ==';
      const decoded = decode(encoded);
      expect(decoded.toString()).toBe('Hello, World!');
    });

    it('decodes empty string', () => {
      const decoded = decode('');
      expect(decoded.length).toBe(0);
    });
  });

  describe('isValidBase64', () => {
    it('returns true for valid base64', () => {
      expect(isValidBase64('SGVsbG8=')).toBe(true);
      expect(isValidBase64('SGVsbG8sIFdvcmxkIQ==')).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isValidBase64('')).toBe(true);
    });

    it('returns false for invalid base64', () => {
      expect(isValidBase64('not valid base64!')).toBe(false);
      expect(isValidBase64('SGVsbG8')).toBe(false); // Missing padding
    });
  });

  describe('round-trip', () => {
    it('encode then decode returns original', () => {
      const original = Buffer.from('Test data with special chars: 日本語');
      const encoded = encode(original);
      const decoded = decode(encoded);
      expect(decoded.toString()).toBe(original.toString());
    });
  });
});
