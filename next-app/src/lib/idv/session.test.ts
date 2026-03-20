/**
 * Tests for IDV Session Module
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import {
  isWelcomeComplete,
  isAgreementComplete,
  isDocumentCaptureComplete,
  isSsnComplete,
  isVerifyInfoComplete,
  isPhoneComplete,
  getIdvStepUrl,
  type IdvSessionData,
} from './session';

describe('IDV Session', () => {
  describe('Step completion checks', () => {
    it('isWelcomeComplete returns false when not visited', () => {
      const session: IdvSessionData = {};
      expect(isWelcomeComplete(session)).toBe(false);
    });

    it('isWelcomeComplete returns true when visited', () => {
      const session: IdvSessionData = { welcomeVisited: true };
      expect(isWelcomeComplete(session)).toBe(true);
    });

    it('isAgreementComplete returns false when no consent', () => {
      const session: IdvSessionData = {};
      expect(isAgreementComplete(session)).toBe(false);
    });

    it('isAgreementComplete returns true when consent given', () => {
      const session: IdvSessionData = { idvConsentGivenAt: '2024-01-01T00:00:00Z' };
      expect(isAgreementComplete(session)).toBe(true);
    });

    it('isDocumentCaptureComplete returns false when incomplete', () => {
      const session: IdvSessionData = {};
      expect(isDocumentCaptureComplete(session)).toBe(false);
    });

    it('isDocumentCaptureComplete returns false when only flag is set', () => {
      const session: IdvSessionData = { documentCaptureComplete: true };
      expect(isDocumentCaptureComplete(session)).toBe(false);
    });

    it('isDocumentCaptureComplete returns true when flag and pii are set', () => {
      const session: IdvSessionData = {
        documentCaptureComplete: true,
        piiFromDoc: { firstName: 'John', lastName: 'Doe' },
      };
      expect(isDocumentCaptureComplete(session)).toBe(true);
    });

    it('isSsnComplete returns false when incomplete', () => {
      const session: IdvSessionData = {};
      expect(isSsnComplete(session)).toBe(false);
    });

    it('isSsnComplete returns false when only flag is set', () => {
      const session: IdvSessionData = { ssnComplete: true };
      expect(isSsnComplete(session)).toBe(false);
    });

    it('isSsnComplete returns true when flag and ssn are set', () => {
      const session: IdvSessionData = { ssnComplete: true, ssn: '123456789' };
      expect(isSsnComplete(session)).toBe(true);
    });

    it('isVerifyInfoComplete returns false when incomplete', () => {
      const session: IdvSessionData = {};
      expect(isVerifyInfoComplete(session)).toBe(false);
    });

    it('isVerifyInfoComplete returns true when successful', () => {
      const session: IdvSessionData = {
        verifyInfoComplete: true,
        resolutionSuccessful: true,
      };
      expect(isVerifyInfoComplete(session)).toBe(true);
    });

    it('isPhoneComplete returns false when incomplete', () => {
      const session: IdvSessionData = {};
      expect(isPhoneComplete(session)).toBe(false);
    });

    it('isPhoneComplete returns true when phone verified', () => {
      const session: IdvSessionData = { phoneComplete: true };
      expect(isPhoneComplete(session)).toBe(true);
    });

    it('isPhoneComplete returns true when using GPO mail verification', () => {
      const session: IdvSessionData = { addressVerificationMechanism: 'gpo' };
      expect(isPhoneComplete(session)).toBe(true);
    });
  });

  describe('getIdvStepUrl', () => {
    it('returns /idv when welcome not visited', () => {
      const session: IdvSessionData = {};
      expect(getIdvStepUrl(session)).toBe('/idv');
    });

    it('returns /idv/agreement when welcome visited but no consent', () => {
      const session: IdvSessionData = { welcomeVisited: true };
      expect(getIdvStepUrl(session)).toBe('/idv/agreement');
    });

    it('returns /idv/document-capture when consent given but no capture', () => {
      const session: IdvSessionData = {
        welcomeVisited: true,
        idvConsentGivenAt: '2024-01-01T00:00:00Z',
      };
      expect(getIdvStepUrl(session)).toBe('/idv/document-capture');
    });

    it('returns /idv/ssn when document captured but no ssn', () => {
      const session: IdvSessionData = {
        welcomeVisited: true,
        idvConsentGivenAt: '2024-01-01T00:00:00Z',
        documentCaptureComplete: true,
        piiFromDoc: { firstName: 'John', lastName: 'Doe' },
      };
      expect(getIdvStepUrl(session)).toBe('/idv/ssn');
    });

    it('returns /idv/verify-info when ssn complete but not verified', () => {
      const session: IdvSessionData = {
        welcomeVisited: true,
        idvConsentGivenAt: '2024-01-01T00:00:00Z',
        documentCaptureComplete: true,
        piiFromDoc: { firstName: 'John', lastName: 'Doe' },
        ssnComplete: true,
        ssn: '123456789',
      };
      expect(getIdvStepUrl(session)).toBe('/idv/verify-info');
    });

    it('returns /idv/phone when verified but phone not complete', () => {
      const session: IdvSessionData = {
        welcomeVisited: true,
        idvConsentGivenAt: '2024-01-01T00:00:00Z',
        documentCaptureComplete: true,
        piiFromDoc: { firstName: 'John', lastName: 'Doe' },
        ssnComplete: true,
        ssn: '123456789',
        verifyInfoComplete: true,
        resolutionSuccessful: true,
      };
      expect(getIdvStepUrl(session)).toBe('/idv/phone');
    });

    it('returns /idv/personal-key when all steps complete', () => {
      const session: IdvSessionData = {
        welcomeVisited: true,
        idvConsentGivenAt: '2024-01-01T00:00:00Z',
        documentCaptureComplete: true,
        piiFromDoc: { firstName: 'John', lastName: 'Doe' },
        ssnComplete: true,
        ssn: '123456789',
        verifyInfoComplete: true,
        resolutionSuccessful: true,
        phoneComplete: true,
      };
      expect(getIdvStepUrl(session)).toBe('/idv/personal-key');
    });
  });
});
