/**
 * State ID Result - Result class for AAMVA state ID verification
 * Mirrors: app/services/proofing/state_id_result.rb
 */

import {
  type StateIdResult as IStateIdResult,
  MVA_EXCEPTION_CODES,
  isTimeoutError,
  checkMvaException,
} from '../types';

export interface StateIdResultOptions {
  success?: boolean;
  errors?: Record<string, string[]>;
  exception?: Error | null;
  vendorName?: string;
  transactionId?: string;
  requestedAttributes?: Record<string, number>;
  verifiedAttributes?: string[];
  jurisdictionInMaintenanceWindow?: boolean;
}

export class StateIdResult implements IStateIdResult {
  readonly success: boolean;
  readonly errors: Record<string, string[]>;
  readonly exception: Error | null;
  readonly vendorName: string;
  readonly transactionId: string;
  readonly requestedAttributes: Record<string, number>;
  readonly verifiedAttributes: string[];
  readonly jurisdictionInMaintenanceWindow: boolean;

  constructor(options: StateIdResultOptions = {}) {
    this.success = options.success ?? false;
    this.errors = options.errors ?? {};
    this.exception = options.exception ?? null;
    this.vendorName = options.vendorName ?? '';
    this.transactionId = options.transactionId ?? '';
    this.requestedAttributes = options.requestedAttributes ?? {};
    this.verifiedAttributes = options.verifiedAttributes ?? [];
    this.jurisdictionInMaintenanceWindow = options.jurisdictionInMaintenanceWindow ?? false;
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
   * Check if MVA was unavailable
   */
  get mvaUnavailable(): boolean {
    return this.exception?.message?.includes(MVA_EXCEPTION_CODES.MVA_UNAVAILABLE) ?? false;
  }

  /**
   * Check if MVA had a system error
   */
  get mvaSystemError(): boolean {
    return this.exception?.message?.includes(MVA_EXCEPTION_CODES.MVA_SYSTEM_ERROR) ?? false;
  }

  /**
   * Check if MVA timed out
   */
  get mvaTimeout(): boolean {
    return this.exception?.message?.includes(MVA_EXCEPTION_CODES.MVA_TIMEOUT) ?? false;
  }

  /**
   * Check if any MVA exception occurred
   */
  get mvaException(): boolean {
    return this.mvaUnavailable || this.mvaSystemError || this.mvaTimeout;
  }

  /**
   * Check if there was an unexpected error code
   */
  get unexpectedErrorCodeException(): boolean {
    return this.exception?.message?.includes(MVA_EXCEPTION_CODES.UNEXPECTED_ERROR_CODE) ?? false;
  }

  /**
   * Check if jurisdiction is in maintenance window
   */
  isJurisdictionInMaintenanceWindow(): boolean {
    return this.jurisdictionInMaintenanceWindow;
  }

  /**
   * Convert to a plain object for serialization
   */
  toHash(): Record<string, unknown> {
    return {
      success: this.success,
      errors: this.errors,
      exception: this.exception,
      mvaException: this.mvaException,
      requestedAttributes: this.requestedAttributes,
      timedOut: this.timedOut,
      transactionId: this.transactionId,
      vendorName: this.vendorName,
      verifiedAttributes: this.verifiedAttributes,
      jurisdictionInMaintenanceWindow: this.jurisdictionInMaintenanceWindow,
    };
  }

  /**
   * Convert to DocAuth response format
   */
  toDocAuthResponse(): {
    success: boolean;
    errors: Record<string, string>;
    exception: Error | null;
    extra: Record<string, unknown>;
  } {
    const docAuthErrors: Record<string, string> = {};

    if (Object.keys(this.errors).length > 0 || this.unexpectedErrorCodeException) {
      docAuthErrors.state_id_verification = 'Document could not be verified.';
    }

    return {
      success: this.success,
      errors: docAuthErrors,
      exception: this.exception,
      extra: this.toHash(),
    };
  }

  /**
   * Create a failed result from an exception
   */
  static fromException(
    exception: Error,
    jurisdiction?: string
  ): StateIdResult {
    const { isMvaException } = checkMvaException(exception);

    return new StateIdResult({
      success: false,
      errors: {},
      exception,
      vendorName: 'aamva:state_id',
      transactionId: '',
      verifiedAttributes: [],
      requestedAttributes: {},
      jurisdictionInMaintenanceWindow: false, // Would need to check maintenance window
    });
  }
}
