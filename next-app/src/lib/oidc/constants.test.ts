/**
 * Tests for OIDC Constants
 */

import { describe, test, expect } from 'vitest';
import {
  ACR_VALUES,
  VALID_AUTHN_CONTEXTS,
  ACR_TO_IAL,
  AALS_BY_PRIORITY,
  IALS_BY_PRIORITY,
  FACIAL_MATCH_IAL_CONTEXTS,
  GRANT_TYPES,
  RESPONSE_TYPES,
  SUBJECT_TYPES,
  ID_TOKEN_SIGNING_ALGS,
  TOKEN_ENDPOINT_AUTH_METHODS,
  CODE_CHALLENGE_METHODS,
  PROMPT_VALUES,
  RANDOM_VALUE_MINIMUM_LENGTH,
  MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS,
  CLIENT_ASSERTION_TYPE,
  ISSUED_AT_LEEWAY_SECONDS,
} from './constants';

describe('OIDC Constants', () => {
  describe('ACR_VALUES', () => {
    test('contains IAL values', () => {
      expect(ACR_VALUES.IAL1).toBe('http://idmanagement.gov/ns/assurance/ial/1');
      expect(ACR_VALUES.IAL2).toBe('http://idmanagement.gov/ns/assurance/ial/2');
      expect(ACR_VALUES.IAL_MAX).toBe('http://idmanagement.gov/ns/assurance/ial/0');
    });

    test('contains AAL values', () => {
      expect(ACR_VALUES.AAL1).toBe('http://idmanagement.gov/ns/assurance/aal/1');
      expect(ACR_VALUES.AAL2).toBe('http://idmanagement.gov/ns/assurance/aal/2');
      expect(ACR_VALUES.AAL3).toBe('http://idmanagement.gov/ns/assurance/aal/3');
    });

    test('contains facial match IAL values', () => {
      expect(ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED).toBe(
        'urn:acr.login.gov:verified-facial-match-required',
      );
      expect(ACR_VALUES.IAL2_BIO_REQUIRED).toBe(
        'http://idmanagement.gov/ns/assurance/ial/2?bio=required',
      );
    });
  });

  describe('VALID_AUTHN_CONTEXTS', () => {
    test('contains all ACR values', () => {
      expect(VALID_AUTHN_CONTEXTS).toContain(ACR_VALUES.IAL1);
      expect(VALID_AUTHN_CONTEXTS).toContain(ACR_VALUES.IAL2);
      expect(VALID_AUTHN_CONTEXTS).toContain(ACR_VALUES.AAL2);
    });

    test('has correct length', () => {
      expect(VALID_AUTHN_CONTEXTS.length).toBe(Object.keys(ACR_VALUES).length);
    });
  });

  describe('ACR_TO_IAL', () => {
    test('maps IAL1 ACRs to 1', () => {
      expect(ACR_TO_IAL[ACR_VALUES.IAL1]).toBe(1);
      expect(ACR_TO_IAL[ACR_VALUES.LOA1]).toBe(1);
      expect(ACR_TO_IAL[ACR_VALUES.IAL_AUTH_ONLY]).toBe(1);
    });

    test('maps IAL2 ACRs to 2', () => {
      expect(ACR_TO_IAL[ACR_VALUES.IAL2]).toBe(2);
      expect(ACR_TO_IAL[ACR_VALUES.LOA3]).toBe(2);
      expect(ACR_TO_IAL[ACR_VALUES.IAL_VERIFIED]).toBe(2);
    });

    test('maps IALMAX to 0', () => {
      expect(ACR_TO_IAL[ACR_VALUES.IAL_MAX]).toBe(0);
    });
  });

  describe('AALS_BY_PRIORITY', () => {
    test('contains AAL values in priority order', () => {
      expect(AALS_BY_PRIORITY[0]).toBe(ACR_VALUES.AAL2_HSPD12);
      expect(AALS_BY_PRIORITY).toContain(ACR_VALUES.AAL2);
      expect(AALS_BY_PRIORITY).toContain(ACR_VALUES.AAL1);
    });

    test('AAL2_HSPD12 has highest priority', () => {
      expect(AALS_BY_PRIORITY.indexOf(ACR_VALUES.AAL2_HSPD12)).toBeLessThan(
        AALS_BY_PRIORITY.indexOf(ACR_VALUES.AAL2),
      );
    });
  });

  describe('IALS_BY_PRIORITY', () => {
    test('contains IAL values in priority order', () => {
      expect(IALS_BY_PRIORITY[0]).toBe(ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED);
      expect(IALS_BY_PRIORITY).toContain(ACR_VALUES.IAL2);
      expect(IALS_BY_PRIORITY).toContain(ACR_VALUES.IAL1);
    });

    test('facial match required has highest priority', () => {
      expect(
        IALS_BY_PRIORITY.indexOf(ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED),
      ).toBeLessThan(IALS_BY_PRIORITY.indexOf(ACR_VALUES.IAL2));
    });
  });

  describe('FACIAL_MATCH_IAL_CONTEXTS', () => {
    test('contains facial match ACR values', () => {
      expect(FACIAL_MATCH_IAL_CONTEXTS).toContain(
        ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED,
      );
      expect(FACIAL_MATCH_IAL_CONTEXTS).toContain(
        ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED,
      );
      expect(FACIAL_MATCH_IAL_CONTEXTS).toContain(ACR_VALUES.IAL2_BIO_REQUIRED);
      expect(FACIAL_MATCH_IAL_CONTEXTS).toContain(ACR_VALUES.IAL2_BIO_PREFERRED);
    });

    test('has 4 elements', () => {
      expect(FACIAL_MATCH_IAL_CONTEXTS).toHaveLength(4);
    });
  });

  describe('OIDC Protocol Constants', () => {
    test('GRANT_TYPES contains authorization_code', () => {
      expect(GRANT_TYPES).toContain('authorization_code');
      expect(GRANT_TYPES).toHaveLength(1);
    });

    test('RESPONSE_TYPES contains code', () => {
      expect(RESPONSE_TYPES).toContain('code');
      expect(RESPONSE_TYPES).toHaveLength(1);
    });

    test('SUBJECT_TYPES contains pairwise', () => {
      expect(SUBJECT_TYPES).toContain('pairwise');
      expect(SUBJECT_TYPES).toHaveLength(1);
    });

    test('ID_TOKEN_SIGNING_ALGS contains RS256', () => {
      expect(ID_TOKEN_SIGNING_ALGS).toContain('RS256');
      expect(ID_TOKEN_SIGNING_ALGS).toHaveLength(1);
    });

    test('TOKEN_ENDPOINT_AUTH_METHODS contains private_key_jwt', () => {
      expect(TOKEN_ENDPOINT_AUTH_METHODS).toContain('private_key_jwt');
      expect(TOKEN_ENDPOINT_AUTH_METHODS).toHaveLength(1);
    });

    test('CODE_CHALLENGE_METHODS contains S256', () => {
      expect(CODE_CHALLENGE_METHODS).toContain('S256');
      expect(CODE_CHALLENGE_METHODS).toHaveLength(1);
    });

    test('PROMPT_VALUES contains login and select_account', () => {
      expect(PROMPT_VALUES).toContain('login');
      expect(PROMPT_VALUES).toContain('select_account');
      expect(PROMPT_VALUES).toHaveLength(2);
    });
  });

  describe('Validation Constants', () => {
    test('RANDOM_VALUE_MINIMUM_LENGTH is 22', () => {
      expect(RANDOM_VALUE_MINIMUM_LENGTH).toBe(22);
    });

    test('MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS is 30', () => {
      expect(MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS).toBe(30);
    });

    test('CLIENT_ASSERTION_TYPE is correct', () => {
      expect(CLIENT_ASSERTION_TYPE).toBe(
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      );
    });

    test('ISSUED_AT_LEEWAY_SECONDS is 10', () => {
      expect(ISSUED_AT_LEEWAY_SECONDS).toBe(10);
    });
  });
});
