/**
 * Mock Proofer Configuration and Client
 * Mirrors: app/services/proofing/mock/resolution_mock_client.rb
 */

import type { ApplicantPii } from '../types';
import type { ThreatMetrixApplicant } from '../threatmetrix/config';
import { ResolutionResult } from '../resolution/result';
import { StateIdResult } from '../aamva/state-id-result';
import { DdpResult } from '../threatmetrix/ddp-result';

/**
 * Mock configuration for testing scenarios
 */
export interface MockProofingConfig {
  shouldFail: boolean;
  failureReason?: string;
  delayMs?: number;
  reviewStatus?: 'pass' | 'review' | 'reject';
}

export const DEFAULT_MOCK_CONFIG: MockProofingConfig = {
  shouldFail: false,
  delayMs: 100,
  reviewStatus: 'pass',
};

/**
 * Special SSN values that trigger specific behaviors in mock
 */
export const MOCK_SSN_TRIGGERS = {
  FAIL_RESOLUTION: '000-00-0000',
  FAIL_STATE_ID: '111-11-1111',
  FAIL_THREATMETRIX: '222-22-2222',
  TIMEOUT: '999-99-9999',
  REVIEW_REQUIRED: '333-33-3333',
} as const;

/**
 * Mock Resolution Proofer for testing
 */
export class MockResolutionProofer {
  private config: MockProofingConfig;

  constructor(config: Partial<MockProofingConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }

  async proof(applicant: ApplicantPii): Promise<ResolutionResult> {
    // Simulate delay
    if (this.config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    // Check for special SSN triggers
    const ssn = applicant.ssn?.replace(/\D/g, '');
    if (ssn === MOCK_SSN_TRIGGERS.FAIL_RESOLUTION.replace(/-/g, '')) {
      return new ResolutionResult({
        success: false,
        errors: { ssn: ['SSN verification failed'] },
        vendorName: 'mock',
      });
    }

    if (ssn === MOCK_SSN_TRIGGERS.TIMEOUT.replace(/-/g, '')) {
      throw new Error('Mock timeout');
    }

    if (this.config.shouldFail) {
      return new ResolutionResult({
        success: false,
        errors: { base: [this.config.failureReason || 'Mock failure'] },
        vendorName: 'mock',
      });
    }

    return new ResolutionResult({
      success: true,
      errors: {},
      vendorName: 'mock',
      transactionId: `mock-${Date.now()}`,
      reference: `mock-ref-${Date.now()}`,
      verifiedAttributes: ['first_name', 'last_name', 'dob', 'address', 'ssn'],
    });
  }
}

/**
 * Mock AAMVA Proofer for testing
 */
export class MockAamvaProofer {
  private config: MockProofingConfig;

  constructor(config: Partial<MockProofingConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }

  async proof(applicant: ApplicantPii): Promise<StateIdResult> {
    // Simulate delay
    if (this.config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    // Check for special SSN triggers
    const ssn = applicant.ssn?.replace(/\D/g, '');
    if (ssn === MOCK_SSN_TRIGGERS.FAIL_STATE_ID.replace(/-/g, '')) {
      return new StateIdResult({
        success: false,
        errors: { state_id_number: ['State ID verification failed'] },
        vendorName: 'mock:aamva',
      });
    }

    if (this.config.shouldFail) {
      return new StateIdResult({
        success: false,
        errors: { base: [this.config.failureReason || 'Mock failure'] },
        vendorName: 'mock:aamva',
      });
    }

    return new StateIdResult({
      success: true,
      errors: {},
      vendorName: 'mock:aamva',
      transactionId: `mock-aamva-${Date.now()}`,
      verifiedAttributes: ['state_id_number', 'dob', 'first_name', 'last_name', 'address'],
      requestedAttributes: {
        state_id_number: 1,
        dob: 1,
        first_name: 1,
        last_name: 1,
        address1: 1,
        city: 1,
        state: 1,
        zipcode: 1,
      },
    });
  }
}

/**
 * Mock ThreatMetrix Proofer for testing
 */
export class MockThreatMetrixProofer {
  private config: MockProofingConfig;

  constructor(config: Partial<MockProofingConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }

  async proof(applicant: ThreatMetrixApplicant): Promise<DdpResult> {
    // Simulate delay
    if (this.config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    // Check for special SSN triggers
    const ssn = applicant.ssn?.replace(/\D/g, '');
    if (ssn === MOCK_SSN_TRIGGERS.FAIL_THREATMETRIX.replace(/-/g, '')) {
      const result = new DdpResult({
        success: false,
        reviewStatus: 'reject',
        client: 'mock',
      });
      result.addError('reject', 'review_status');
      return result;
    }

    if (ssn === MOCK_SSN_TRIGGERS.REVIEW_REQUIRED.replace(/-/g, '')) {
      const result = new DdpResult({
        success: false,
        reviewStatus: 'review',
        client: 'mock',
      });
      result.addError('review', 'review_status');
      return result;
    }

    if (this.config.shouldFail) {
      return DdpResult.fromException(new Error(this.config.failureReason || 'Mock failure'));
    }

    return new DdpResult({
      success: true,
      reviewStatus: this.config.reviewStatus || 'pass',
      client: 'mock',
      transactionId: `mock-tmx-${Date.now()}`,
      sessionId: applicant.threatmetrixSessionId,
      responseBody: {
        request_id: `mock-tmx-${Date.now()}`,
        request_result: 'success',
        review_status: this.config.reviewStatus || 'pass',
        fuzzy_device_id: `mock-device-${Date.now()}`,
      },
    });
  }
}

/**
 * Factory functions for mock proofers
 */
export function createMockResolutionProofer(config?: Partial<MockProofingConfig>): MockResolutionProofer {
  return new MockResolutionProofer(config);
}

export function createMockAamvaProofer(config?: Partial<MockProofingConfig>): MockAamvaProofer {
  return new MockAamvaProofer(config);
}

export function createMockThreatMetrixProofer(config?: Partial<MockProofingConfig>): MockThreatMetrixProofer {
  return new MockThreatMetrixProofer(config);
}
