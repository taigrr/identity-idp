/**
 * Socure KYC Proofer - Identity verification via Socure ID+
 * Mirrors: app/services/proofing/socure/id_plus/proofers/kyc_proofer.rb
 */

import type { ResolutionResult } from '../types';
import type {
  SocureConfig,
  SocureInput,
  SocureKycRequestBody,
  SocureKycResponseBody,
} from './types';
import { VERIFIED_ATTRIBUTE_MAP, REQUIRED_ATTRIBUTES, getSocureConfig } from './types';
import { ProofingTimeoutError } from '../types';
import { ResolutionResult as ResolutionResultClass } from '../resolution/result';

const VENDOR_NAME = 'socure_kyc';

export interface KycProoferOptions {
  config: SocureConfig;
  analytics?: {
    idvSocureKycResults?: (result: Record<string, unknown>) => void;
  };
}

/**
 * Socure KYC Proofer class
 */
export class SocureKycProofer {
  private config: SocureConfig;
  private analytics?: KycProoferOptions['analytics'];

  constructor(options: KycProoferOptions) {
    this.config = options.config;
    this.analytics = options.analytics;
  }

  /**
   * Perform KYC verification
   */
  async proof(applicant: SocureInput): Promise<ResolutionResultClass> {
    try {
      const response = await this.sendRequest(applicant);
      const result = this.buildResultFromResponse(response);
      this.logResult(result);
      return result;
    } catch (error) {
      const result = this.buildResultFromError(error as Error);
      this.logResult(result);
      return result;
    }
  }

  /**
   * Send KYC request to Socure
   */
  private async sendRequest(input: SocureInput): Promise<SocureKycResponseBody> {
    const url = `${this.config.baseUrl}/EmailAuthScore`;
    const body = this.buildRequestBody(input);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout * 1000
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `SocureApiKey ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Socure KYC request failed with status: ${response.status}`);
      }

      return await response.json() as SocureKycResponseBody;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ProofingTimeoutError('Socure KYC request timed out');
      }

      throw error;
    }
  }

  /**
   * Build request body for Socure API
   */
  private buildRequestBody(input: SocureInput): SocureKycRequestBody {
    return {
      modules: ['kyc'],
      customerUserId: this.config.userUuid,
      firstName: input.first_name,
      surName: input.last_name,
      country: 'US',
      physicalAddress: input.address1,
      physicalAddress2: input.address2,
      city: input.city,
      state: input.state,
      zip: input.zipcode,
      nationalId: input.ssn,
      dob: input.dob,
      userConsent: true,
      consentTimestamp: input.consent_given_at,
      email: this.config.userEmail,
      mobileNumber: input.phone,
      countryOfOrigin: 'US',
    };
  }

  /**
   * Build result from successful response
   */
  private buildResultFromResponse(response: SocureKycResponseBody): ResolutionResultClass {
    const kyc = response.kyc;
    const fieldValidations = kyc?.fieldValidations || {};
    const reasonCodes = new Set(kyc?.reasonCodes || []);

    const verifiedAttributes = this.getVerifiedAttributes(fieldValidations);
    const allRequiredVerified = this.allRequiredAttributesVerified(verifiedAttributes);
    const hasAutoFailReasonCodes = this.hasAutoFailReasonCodes(reasonCodes);

    const success = allRequiredVerified && !hasAutoFailReasonCodes;

    return new ResolutionResultClass({
      success,
      errors: {},
      vendorName: VENDOR_NAME,
      verifiedAttributes: Array.from(verifiedAttributes),
      transactionId: response.referenceId,
      vendorId: kyc?.socureId,
      sourceAttribution: kyc?.sourceAttribution || [],
      customerUserId: this.config.userUuid,
      reasonCodes: { socure: Array.from(reasonCodes) },
    });
  }

  /**
   * Build result from error
   */
  private buildResultFromError(error: Error): ResolutionResultClass {
    return new ResolutionResultClass({
      success: false,
      errors: {},
      exception: error,
      vendorName: VENDOR_NAME,
      transactionId: (error as any).referenceId,
    });
  }

  /**
   * Get verified attributes from field validations
   */
  private getVerifiedAttributes(fieldValidations: Record<string, number>): Set<string> {
    const verified = new Set<string>();

    for (const [attrName, fieldNames] of Object.entries(VERIFIED_ATTRIBUTE_MAP)) {
      const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      const allFieldsValid = fields.every(f => Math.round(fieldValidations[f] || 0) === 1);

      if (allFieldsValid) {
        verified.add(attrName);
      }
    }

    return verified;
  }

  /**
   * Check if all required attributes are verified
   */
  private allRequiredAttributesVerified(verifiedAttributes: Set<string>): boolean {
    for (const required of REQUIRED_ATTRIBUTES) {
      if (!verifiedAttributes.has(required)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if response has auto-fail reason codes
   */
  private hasAutoFailReasonCodes(reasonCodes: Set<string>): boolean {
    for (const code of reasonCodes) {
      if (this.config.autoFailureReasonCodes.includes(code)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Log result to analytics
   */
  private logResult(result: ResolutionResultClass): void {
    this.analytics?.idvSocureKycResults?.(result.toHash());
  }
}

/**
 * Factory function to create Socure KYC Proofer
 */
export function createSocureKycProofer(
  userUuid: string,
  userEmail?: string,
  analytics?: KycProoferOptions['analytics']
): SocureKycProofer {
  return new SocureKycProofer({
    config: getSocureConfig(userUuid, userEmail),
    analytics,
  });
}
