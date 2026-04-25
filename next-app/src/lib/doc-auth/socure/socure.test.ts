/**
 * Socure DocAuth tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SocureClient,
  SocureApiError,
  SocureDocvResultResponse,
  type SocureConfig,
  type SocureIdPlusResponse,
} from './index';

// Test fixtures
const mockConfig: SocureConfig = {
  apiKey: 'test-api-key',
  documentRequestEndpoint: 'https://socure.example.com/docv/document',
  idplusBaseUrl: 'https://socure.example.com',
  imagesRequestEndpoint: 'https://socure.example.com/images/',
  flowIdOnly: 'flow-id-only',
  flowIdWithSelfie: 'flow-id-with-selfie',
  webhookSecretKey: 'webhook-secret',
  reasonCodesSelfiePass: ['I850'],
  reasonCodesSelfieFailure: ['R827', 'R828'],
  reasonCodesSelfieNotProcessed: ['I847'],
  passportVendorSwitchingEnabled: true,
  passportVendorPercent: 100,
};

const mockSuccessResponse: SocureIdPlusResponse = {
  referenceId: 'ref-123',
  status: 'success',
  msg: 'OK',
  documentVerification: {
    decision: {
      name: 'accept',
      value: 'accept',
    },
    reasonCodes: ['I850'],
    documentType: {
      type: 'DriversLicense',
      state: 'CA',
      country: 'US',
    },
    documentData: {
      firstName: 'John',
      middleName: 'Q',
      surName: 'Public',
      dob: '1980-01-15',
      documentNumber: 'D12345678',
      issueDate: '2020-01-01',
      expirationDate: '2028-01-01',
      parsedAddress: {
        physicalAddress: '123 Main St',
        physicalAddress2: 'Apt 4',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
      },
    },
  },
  customerProfile: {
    customerUserId: 'user-123',
    userId: 'socure-user-456',
  },
};

const mockRejectResponse: SocureIdPlusResponse = {
  referenceId: 'ref-456',
  status: 'reject',
  documentVerification: {
    decision: {
      name: 'reject',
      value: 'reject',
    },
    reasonCodes: ['R100', 'R200'],
    documentType: {
      type: 'DriversLicense',
      state: 'CA',
      country: 'US',
    },
  },
};

describe('SocureDocvResultResponse', () => {
  describe('success response', () => {
    it('parses successful verification', () => {
      const response = new SocureDocvResultResponse({
        response: mockSuccessResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.success).toBe(true);
      expect(response.docAuthSuccess).toBe(true);
      expect(response.referenceId).toBe('ref-123');
      expect(response.selfieStatus).toBe('passed');
    });

    it('extracts PII from response', () => {
      const response = new SocureDocvResultResponse({
        response: mockSuccessResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.piiFromDoc?.firstName).toBe('John');
      expect(response.piiFromDoc?.lastName).toBe('Public');
      expect(response.piiFromDoc?.dob).toBe('1980-01-15');
      expect(response.piiFromDoc?.address1).toBe('123 Main St');
      expect(response.piiFromDoc?.city).toBe('Los Angeles');
      expect(response.piiFromDoc?.state).toBe('CA');
      expect(response.piiFromDoc?.zipCode).toBe('90210');
      expect(response.piiFromDoc?.stateIdNumber).toBe('D12345678');
    });

    it('includes extra attributes', () => {
      const response = new SocureDocvResultResponse({
        response: mockSuccessResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.extra.vendor).toBe('Socure');
      expect(response.extra.referenceId).toBe('ref-123');
      expect(response.extra.docAuthSuccess).toBe(true);
      expect(response.extra.addressLine2Present).toBe(true);
    });
  });

  describe('reject response', () => {
    it('handles rejected verification', () => {
      const response = new SocureDocvResultResponse({
        response: mockRejectResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.success).toBe(false);
      expect(response.docAuthSuccess).toBe(false);
      expect(response.errors.socure).toBeDefined();
    });
  });

  describe('selfie status', () => {
    it('detects selfie pass', () => {
      const response = new SocureDocvResultResponse({
        response: mockSuccessResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.selfieStatus).toBe('passed');
      expect(response.livenessEnabled).toBe(true);
    });

    it('detects selfie failure', () => {
      const failResponse: SocureIdPlusResponse = {
        ...mockSuccessResponse,
        documentVerification: {
          ...mockSuccessResponse.documentVerification!,
          decision: { name: 'accept', value: 'accept' },
          reasonCodes: ['R827'],
        },
      };

      const response = new SocureDocvResultResponse({
        response: failResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.selfieStatus).toBe('failed');
      expect(response.success).toBe(false);
    });

    it('detects selfie not processed', () => {
      const notProcessedResponse: SocureIdPlusResponse = {
        ...mockSuccessResponse,
        documentVerification: {
          ...mockSuccessResponse.documentVerification!,
          reasonCodes: ['I847'],
        },
      };

      const response = new SocureDocvResultResponse({
        response: notProcessedResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.selfieStatus).toBe('not_processed');
    });
  });

  describe('passport handling', () => {
    it('parses passport response', () => {
      const passportResponse: SocureIdPlusResponse = {
        ...mockSuccessResponse,
        documentVerification: {
          ...mockSuccessResponse.documentVerification!,
          documentType: {
            type: 'Passport',
            country: 'US',
          },
          documentData: {
            firstName: 'John',
            surName: 'Public',
            dob: '1980-01-15',
            documentNumber: 'P12345678',
            expirationDate: '2030-01-01',
          },
          rawData: {
            mrz: 'P<USAPUBLIC<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<',
          },
        },
      };

      const response = new SocureDocvResultResponse({
        response: passportResponse,
        passportRequested: true,
        config: mockConfig,
      });

      expect(response.success).toBe(true);
      expect(response.piiFromDoc?.passportNumber).toBe('P12345678');
      expect(response.extra.mrz).toBe(
        'P<USAPUBLIC<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<'
      );
    });

    it('fails when passport not expected but received', () => {
      const passportResponse: SocureIdPlusResponse = {
        ...mockSuccessResponse,
        documentVerification: {
          ...mockSuccessResponse.documentVerification!,
          documentType: {
            type: 'Passport',
            country: 'US',
          },
        },
      };

      const response = new SocureDocvResultResponse({
        response: passportResponse,
        passportRequested: false,
        config: mockConfig,
      });

      expect(response.success).toBe(false);
    });
  });
});

describe('SocureClient', () => {
  let client: SocureClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new SocureClient({
      config: mockConfig,
      fetch: mockFetch,
    });
  });

  describe('createDocumentSession', () => {
    it('creates document capture session', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://docv.socure.com/capture?token=abc123',
          docvTransactionToken: 'txn-token-123',
          referenceId: 'ref-789',
        }),
      });

      const result = await client.createDocumentSession({
        customerUserId: 'user-123',
        redirectUrl: 'https://example.com/callback',
        language: 'en',
        livenessCheckingRequired: true,
      });

      expect(result.url).toContain('socure.com');
      expect(result.docvTransactionToken).toBe('txn-token-123');

      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.documentRequestEndpoint,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `SocureApiKey ${mockConfig.apiKey}`,
          }),
        })
      );
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          status: 'error',
          msg: 'Invalid request',
          referenceId: 'err-ref-123',
        }),
      });

      await expect(
        client.createDocumentSession({
          customerUserId: 'user-123',
          redirectUrl: 'https://example.com/callback',
          language: 'en',
        })
      ).rejects.toThrow(SocureApiError);
    });

    it('uses correct flow ID for liveness', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://docv.socure.com/capture',
          docvTransactionToken: 'txn-123',
        }),
      });

      await client.createDocumentSession({
        customerUserId: 'user-123',
        redirectUrl: 'https://example.com/callback',
        language: 'en',
        livenessCheckingRequired: true,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.config.useCaseKey).toBe(mockConfig.flowIdWithSelfie);
    });

    it('normalizes Chinese language code', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://docv.socure.com/capture',
          docvTransactionToken: 'txn-123',
        }),
      });

      await client.createDocumentSession({
        customerUserId: 'user-123',
        redirectUrl: 'https://example.com/callback',
        language: 'zh',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.config.language).toBe('zh-cn');
    });
  });

  describe('fetchDocvResult', () => {
    it('fetches verification results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await client.fetchDocvResult({
        customerUserId: 'user-123',
        documentCaptureSessionUuid: 'session-456',
        userEmail: 'user@example.com',
        docvTransactionToken: 'txn-789',
      });

      expect(result).toBeInstanceOf(SocureDocvResultResponse);
      expect(result.success).toBe(true);
      expect(result.piiFromDoc?.firstName).toBe('John');
    });

    it('handles verification errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          status: 'error',
          msg: 'Internal server error',
        }),
      });

      await expect(
        client.fetchDocvResult({
          customerUserId: 'user-123',
          documentCaptureSessionUuid: 'session-456',
          userEmail: 'user@example.com',
          docvTransactionToken: 'txn-789',
        })
      ).rejects.toThrow(SocureApiError);
    });
  });
});

describe('SocureApiError', () => {
  it('includes error details', () => {
    const error = new SocureApiError(
      'Request failed',
      400,
      'ref-123',
      'error',
      'Invalid request'
    );

    expect(error.message).toBe('Request failed');
    expect(error.status).toBe(400);
    expect(error.referenceId).toBe('ref-123');
    expect(error.vendorStatus).toBe('error');
    expect(error.vendorStatusMessage).toBe('Invalid request');
    expect(error.name).toBe('SocureApiError');
  });
});
