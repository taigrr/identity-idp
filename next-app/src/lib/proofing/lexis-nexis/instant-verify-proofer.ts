/**
 * LexisNexis InstantVerify Proofer - Identity resolution via LexisNexis
 * Mirrors: app/services/proofing/lexis_nexis/instant_verify/proofer.rb
 */

import { randomUUID } from 'crypto';
import { ProofingTimeoutError } from '../types';
import { ResolutionResult } from '../resolution/result';
import type { LexisNexisConfig, InstantVerifyApplicant, InstantVerifyResponseBody, InstantVerifyProduct } from './config';
import { createLexisNexisConfig, mapFailedChecksToAttributes } from './config';
import { createHmacAuthorization } from './request-signer';

/**
 * Verification error parser response
 */
interface VerificationParseResult {
  status: 'passed' | 'failed';
  errors: Record<string, string[]>;
}

export interface InstantVerifyProoferOptions {
  config?: LexisNexisConfig;
}

/**
 * LexisNexis InstantVerify Proofer class
 */
export class InstantVerifyProofer {
  private config: LexisNexisConfig;

  constructor(options: InstantVerifyProoferOptions = {}) {
    this.config = options.config ?? createLexisNexisConfig();
  }

  /**
   * Verify identity via InstantVerify
   */
  async proof(applicant: InstantVerifyApplicant): Promise<ResolutionResult> {
    try {
      const response = await this.sendRequest(applicant);
      const result = this.buildResultFromResponse(response);
      return result;
    } catch (error) {
      return this.buildResultFromException(error as Error);
    }
  }

  /**
   * Send InstantVerify request
   */
  private async sendRequest(applicant: InstantVerifyApplicant): Promise<InstantVerifyResponseBody> {
    const body = this.buildRequestBody(applicant);
    const path = this.buildRequestPath();
    const url = `${this.config.baseUrl}${path}`;

    const authorization = createHmacAuthorization(
      {
        baseUrl: this.config.baseUrl,
        hmacKeyId: this.config.hmacKeyId,
        hmacSecretKey: this.config.hmacSecretKey,
      },
      body,
      path
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.requestTimeout * 1000
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Unexpected status code '${response.status}': ${responseBody}`);
      }

      return await response.json() as InstantVerifyResponseBody;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ProofingTimeoutError('LexisNexis timed out waiting for verification response');
      }

      throw error;
    }
  }

  /**
   * Build request body for InstantVerify
   */
  private buildRequestBody(applicant: InstantVerifyApplicant): string {
    const uuid = applicant.uuidPrefix
      ? `${applicant.uuidPrefix}:${applicant.uuid}`
      : applicant.uuid;

    const body = {
      Settings: {
        AccountNumber: this.config.accountId,
        Mode: this.config.requestMode,
        Reference: uuid,
        Locale: 'en_US',
        Venue: 'online',
      },
      Person: {
        Name: {
          FirstName: applicant.firstName,
          LastName: applicant.lastName,
        },
        SSN: {
          Number: applicant.ssn.replace(/\D/g, ''),
          Type: 'ssn9',
        },
        DateOfBirth: this.formatDate(applicant.dob),
        Addresses: [this.formatAddress(applicant)],
      },
    };

    return JSON.stringify(body);
  }

  /**
   * Format date for LexisNexis API
   */
  private formatDate(dob: string): string {
    // Convert YYYY-MM-DD to object format expected by API
    const [year, month, day] = dob.split('-');
    return JSON.stringify({
      Year: parseInt(year, 10),
      Month: parseInt(month, 10),
      Day: parseInt(day, 10),
    }).slice(1, -1); // Remove outer quotes since we're inside JSON
  }

  /**
   * Format address for LexisNexis API
   */
  private formatAddress(applicant: InstantVerifyApplicant): Record<string, string> {
    const zip5Match = applicant.zipcode?.match(/^\d{5}/);
    
    return {
      StreetAddress1: applicant.address1,
      StreetAddress2: applicant.address2 || '',
      City: applicant.city,
      State: applicant.state,
      Zip5: zip5Match ? zip5Match[0] : '',
      Country: 'US',
      Context: 'primary',
    };
  }

  /**
   * Build request path for InstantVerify
   */
  private buildRequestPath(): string {
    return `/restws/identity/v2/${this.config.accountId}/${this.config.instantVerifyWorkflow}/conversation`;
  }

  /**
   * Build result from successful response
   */
  private buildResultFromResponse(response: InstantVerifyResponseBody): ResolutionResult {
    const { status, errors } = this.parseVerificationErrors(response);
    const instantVerifyProduct = this.findInstantVerifyProduct(response);

    const conversationId = response.Status?.ConversationId || '';
    const reference = response.Status?.Reference || '';
    const transactionReasonCode = response.Status?.TransactionReasonCode?.Code || '';

    const canPassWithAdditional = this.canPassWithAdditionalVerification(
      status,
      transactionReasonCode,
      instantVerifyProduct
    );

    const attributesRequiringVerification = canPassWithAdditional
      ? mapFailedChecksToAttributes(instantVerifyProduct)
      : [];

    return new ResolutionResult({
      success: status === 'passed',
      errors,
      exception: null,
      vendorName: 'lexisnexis:instant_verify',
      transactionId: conversationId,
      reference,
      failedResultCanPassWithAdditionalVerification: canPassWithAdditional,
      attributesRequiringAdditionalVerification: attributesRequiringVerification,
      vendorWorkflow: this.config.instantVerifyWorkflow,
    });
  }

  /**
   * Build result from exception
   */
  private buildResultFromException(exception: Error): ResolutionResult {
    return ResolutionResult.fromException(
      exception,
      'lexisnexis:instant_verify',
      this.config.instantVerifyWorkflow
    );
  }

  /**
   * Parse verification errors from response
   */
  private parseVerificationErrors(response: InstantVerifyResponseBody): VerificationParseResult {
    const errors: Record<string, string[]> = {};
    let status: 'passed' | 'failed' = 'passed';

    // Check products for errors
    for (const product of response.Products || []) {
      if (product.ProductStatus === 'fail') {
        status = 'failed';

        // Add errors from items
        for (const item of product.Items || []) {
          if (item.ItemStatus !== 'pass') {
            const key = item.ItemName;
            if (!errors[key]) {
              errors[key] = [];
            }
            errors[key].push(item.ItemStatus);
          }
        }
      }
    }

    return { status, errors };
  }

  /**
   * Find the InstantVerify product in the response
   */
  private findInstantVerifyProduct(response: InstantVerifyResponseBody): InstantVerifyProduct | null {
    const products = response.Products || [];

    // Only return if there's exactly one product and it's InstantVerify
    if (products.length !== 1) {
      return null;
    }

    const product = products[0];
    if (product.ProductType !== 'InstantVerify') {
      return null;
    }

    return product;
  }

  /**
   * Check if failed result can pass with additional verification
   */
  private canPassWithAdditionalVerification(
    status: string,
    transactionReasonCode: string,
    product: InstantVerifyProduct | null
  ): boolean {
    if (status !== 'failed') {
      return false;
    }

    // Check for specific transaction reason codes
    const codePattern = /(total|priority)\.scoring\.model\.verification\.fail/;
    if (!transactionReasonCode || !codePattern.test(transactionReasonCode)) {
      return false;
    }

    if (!product || product.ProductStatus !== 'fail') {
      return false;
    }

    // Check if there are attributes that can be verified additionally
    const attributes = mapFailedChecksToAttributes(product);
    return attributes.length > 0;
  }
}

/**
 * Factory function to create InstantVerify proofer
 */
export function createInstantVerifyProofer(options?: InstantVerifyProoferOptions): InstantVerifyProofer {
  return new InstantVerifyProofer(options);
}
