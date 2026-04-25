/**
 * Mock DocAuth client for testing and development
 * @see app/services/doc_auth/mock/doc_auth_mock_client.rb
 */

import { DocAuthResponse } from '../response';
import type { DocAuthClient, PostImagesRequest, DocAuthResult, PiiFromDoc } from '../types';
import { DocAuthErrors } from '../errors';

export interface MockClientConfig {
  defaultSuccess?: boolean;
  mockPii?: Partial<PiiFromDoc>;
  errorScenario?: MockErrorScenario;
}

export type MockErrorScenario =
  | 'network_error'
  | 'barcode_error'
  | 'document_expired'
  | 'id_not_recognized'
  | 'selfie_failure'
  | 'dpi_low'
  | 'glare_low'
  | 'sharp_low';

const DEFAULT_MOCK_PII: PiiFromDoc = {
  firstName: 'FAKEY',
  middleName: 'M',
  lastName: 'MCFAKERSON',
  address1: '123 FAKE ST',
  address2: undefined,
  city: 'FAKETOWN',
  state: 'MT',
  stateIdJurisdiction: 'MT',
  stateIdNumber: '12345678901234567890',
  stateIdType: 'drivers_license',
  stateIdIssued: '2020-01-01',
  stateIdExpiration: '2030-01-01',
  zipCode: '59010-1234',
  dob: '1970-01-01',
  sex: 'M',
  height: '72 IN',
  weight: '200 LB',
  eyeColor: 'BRO',
};

export class MockDocAuthClient implements DocAuthClient {
  private config: MockClientConfig;

  constructor(config: MockClientConfig = {}) {
    this.config = {
      defaultSuccess: true,
      ...config,
    };
  }

  async postImages(request: PostImagesRequest): Promise<DocAuthResult> {
    await this.simulateNetworkDelay();

    if (this.config.errorScenario) {
      return this.generateErrorResponse(this.config.errorScenario);
    }

    const pii: PiiFromDoc = {
      ...DEFAULT_MOCK_PII,
      ...this.config.mockPii,
    };

    if (request.passportImage || request.passportRequested) {
      pii.stateIdType = undefined;
      pii.stateIdNumber = undefined;
      pii.stateIdJurisdiction = undefined;
      pii.passportNumber = 'C00000001';
      pii.passportIssued = '2020-01-01';
      pii.passportExpiration = '2030-01-01';
      pii.issuingCountryCode = 'USA';
    }

    return new DocAuthResponse({
      success: this.config.defaultSuccess ?? true,
      piiFromDoc: pii,
      extra: {
        conversationId: `mock-${Date.now()}`,
        transactionId: `mock-tx-${Date.now()}`,
        documentType: request.passportImage ? 'Passport' : 'DriversLicense',
        vendor: 'mock',
      },
      attentionWithBarcode: false,
      docTypeSupported: true,
      selfieStatus: request.selfieImage ? 'passed' : 'not_processed',
      selfieLive: true,
      selfieQualityGood: true,
    }).toJSON();
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 200 + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private generateErrorResponse(scenario: MockErrorScenario): DocAuthResult {
    switch (scenario) {
      case 'network_error':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.NETWORK]: ['Network error communicating with vendor'] },
        }).toJSON();

      case 'barcode_error':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.BARCODE_READ_CHECK]: ['Could not read barcode'] },
          attentionWithBarcode: true,
        }).toJSON();

      case 'document_expired':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.DOCUMENT_EXPIRED_CHECK]: ['Document has expired'] },
        }).toJSON();

      case 'id_not_recognized':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.ID_NOT_RECOGNIZED]: ['Document type not recognized'] },
          docTypeSupported: false,
        }).toJSON();

      case 'selfie_failure':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.SELFIE_FAILURE]: ['Selfie did not match document photo'] },
          selfieStatus: 'failed',
          selfieLive: false,
        }).toJSON();

      case 'dpi_low':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.DPI_LOW]: ['Image resolution too low'] },
        }).toJSON();

      case 'glare_low':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.GLARE_LOW]: ['Too much glare on image'] },
        }).toJSON();

      case 'sharp_low':
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.SHARP_LOW]: ['Image too blurry'] },
        }).toJSON();

      default:
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.GENERAL_ERROR]: ['Unknown error'] },
        }).toJSON();
    }
  }

  setErrorScenario(scenario: MockErrorScenario | undefined): void {
    this.config.errorScenario = scenario;
  }

  setDefaultSuccess(success: boolean): void {
    this.config.defaultSuccess = success;
  }

  setMockPii(pii: Partial<PiiFromDoc>): void {
    this.config.mockPii = pii;
  }
}
