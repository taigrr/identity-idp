/**
 * Country Codes Loader Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadCountryDialingCodes,
  getCountryDialingCodes,
  resetCountryCodesCache,
} from './country-codes';

const mockYamlContent = `
US:
  country_code: '1'
  name: United States
  supports_sms: true
  supports_voice: true
CA:
  country_code: '1'
  name: Canada
  supports_sms: true
  supports_voice: false
GB:
  country_code: '44'
  name: United Kingdom
  supports_sms: true
  supports_voice: false
VN:
  country_code: '84'
  name: Vietnam
  supports_sms: false
  supports_voice: true
  supports_voice_unconfirmed: false
`;

const mockReadFile = vi.fn();

vi.mock('fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

describe('Country Codes Loader', () => {
  beforeEach(() => {
    resetCountryCodesCache();
    mockReadFile.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadCountryDialingCodes', () => {
    it('loads and parses country codes from YAML file', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      const codes = await loadCountryDialingCodes();

      expect(codes.US).toBeDefined();
      expect(codes.US.country_code).toBe('1');
      expect(codes.US.name).toBe('United States');
      expect(codes.US.supports_sms).toBe(true);
      expect(codes.US.supports_voice).toBe(true);
    });

    it('caches the loaded codes', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      await loadCountryDialingCodes();
      await loadCountryDialingCodes();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('returns empty object if file not found', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const codes = await loadCountryDialingCodes();

      expect(codes).toEqual({});
    });

    it('includes all expected fields for countries', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      const codes = await loadCountryDialingCodes();

      // US - full support
      expect(codes.US.supports_sms).toBe(true);
      expect(codes.US.supports_voice).toBe(true);

      // Canada - SMS only
      expect(codes.CA.supports_sms).toBe(true);
      expect(codes.CA.supports_voice).toBe(false);

      // Vietnam - voice only with confirmed requirement
      expect(codes.VN.supports_sms).toBe(false);
      expect(codes.VN.supports_voice).toBe(true);
      expect(codes.VN.supports_voice_unconfirmed).toBe(false);
    });
  });

  describe('getCountryDialingCodes', () => {
    it('returns country codes for given locale', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      const codes = await getCountryDialingCodes('en');

      expect(codes.US).toBeDefined();
      expect(codes.CA).toBeDefined();
      expect(codes.GB).toBeDefined();
    });

    it('defaults to returning codes even if locale not specified', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      const codes = await getCountryDialingCodes();

      expect(codes.US).toBeDefined();
    });
  });

  describe('resetCountryCodesCache', () => {
    it('clears the cache so codes are reloaded', async () => {
      mockReadFile.mockResolvedValue(mockYamlContent);

      await loadCountryDialingCodes();
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      resetCountryCodesCache();
      await loadCountryDialingCodes();
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });
});
