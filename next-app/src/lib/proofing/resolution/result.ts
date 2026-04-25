/**
 * Resolution Result - Result class for identity resolution proofing
 * Mirrors: app/services/proofing/resolution/result.rb
 */

import {
  type ResolutionResult as IResolutionResult,
  ProofingTimeoutError,
  isTimeoutError,
} from '../types';

export interface ResolutionResultOptions {
  success?: boolean;
  errors?: Record<string, string[]>;
  exception?: Error | null;
  vendorName?: string;
  vendorId?: string;
  transactionId?: string;
  customerUserId?: string;
  reference?: string;
  reasonCodes?: Record<string, string[]>;
  sourceAttribution?: string[];
  failedResultCanPassWithAdditionalVerification?: boolean;
  attributesRequiringAdditionalVerification?: string[];
  vendorWorkflow?: string;
  verifiedAttributes?: string[];
}

export class ResolutionResult implements IResolutionResult {
  readonly success: boolean;
  readonly errors: Record<string, string[]>;
  readonly exception: Error | null;
  readonly vendorName: string;
  readonly vendorId?: string;
  readonly transactionId: string;
  readonly customerUserId?: string;
  readonly reference: string;
  readonly reasonCodes: Record<string, string[]>;
  readonly sourceAttribution: string[];
  readonly failedResultCanPassWithAdditionalVerification: boolean;
  readonly attributesRequiringAdditionalVerification: string[];
  readonly vendorWorkflow?: string;
  readonly verifiedAttributes?: string[];

  constructor(options: ResolutionResultOptions = {}) {
    this.success = options.success ?? false;
    this.errors = options.errors ?? {};
    this.exception = options.exception ?? null;
    this.vendorName = options.vendorName ?? '';
    this.vendorId = options.vendorId;
    this.transactionId = options.transactionId ?? '';
    this.customerUserId = options.customerUserId;
    this.reference = options.reference ?? '';
    this.reasonCodes = options.reasonCodes ?? {};
    this.sourceAttribution = options.sourceAttribution ?? [];
    this.failedResultCanPassWithAdditionalVerification =
      options.failedResultCanPassWithAdditionalVerification ?? false;
    this.attributesRequiringAdditionalVerification =
      options.attributesRequiringAdditionalVerification ?? [];
    this.vendorWorkflow = options.vendorWorkflow;
    this.verifiedAttributes = options.verifiedAttributes;
  }

  /**
   * Check if the result was successful
   */
  isSuccess(): boolean {
    return this.success;
  }

  /**
   * Check if the result timed out
   */
  get timedOut(): boolean {
    return isTimeoutError(this.exception);
  }

  /**
   * Check if the failed result can pass with additional verification
   */
  canPassWithAdditionalVerification(): boolean {
    return this.failedResultCanPassWithAdditionalVerification;
  }

  /**
   * Convert to a plain object for serialization
   */
  toHash(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      success: this.success,
      errors: this.errors,
      exception: this.exception,
      timedOut: this.timedOut,
      transactionId: this.transactionId,
      reference: this.reference,
      reasonCodes: this.reasonCodes,
      canPassWithAdditionalVerification: this.failedResultCanPassWithAdditionalVerification,
      attributesRequiringAdditionalVerification: this.attributesRequiringAdditionalVerification,
      sourceAttribution: this.sourceAttribution,
      vendorName: this.vendorName,
      vendorId: this.vendorId,
      vendorWorkflow: this.vendorWorkflow,
      verifiedAttributes: this.verifiedAttributes,
    };

    if (this.customerUserId) {
      result.customerUserId = this.customerUserId;
    }

    return result;
  }

  /**
   * Create a failed result from an exception
   */
  static fromException(exception: Error, vendorName: string, vendorWorkflow?: string): ResolutionResult {
    return new ResolutionResult({
      success: false,
      errors: {},
      exception,
      vendorName,
      vendorWorkflow,
    });
  }

  /**
   * Create a timeout result
   */
  static timeout(vendorName: string, vendorWorkflow?: string): ResolutionResult {
    return new ResolutionResult({
      success: false,
      errors: {},
      exception: new ProofingTimeoutError(),
      vendorName,
      vendorWorkflow,
    });
  }
}
