/**
 * DDP Result - Result class for ThreatMetrix device profiling
 * Mirrors: app/services/proofing/ddp_result.rb
 */

import {
  type DdpResult as IDdpResult,
  type DdpReviewStatus,
  type DdpResponseBody,
  isTimeoutError,
} from '../types';

export interface DdpResultOptions {
  success?: boolean;
  errors?: Record<string, Set<string>>;
  context?: Record<string, unknown>;
  exception?: Error | null;
  transactionId?: string;
  accountLexId?: string;
  sessionId?: string;
  reviewStatus?: DdpReviewStatus | null;
  responseBody?: DdpResponseBody | null;
  client?: string;
}

/**
 * Redacts sensitive fields from DDP response body
 */
function redactResponseBody(responseBody: DdpResponseBody | null | undefined): DdpResponseBody | null {
  if (!responseBody) return null;

  const sensitiveFields = [
    'account_email',
    'account_telephone',
    'input_ip_address',
    'true_ip_address',
  ];

  const redacted = { ...responseBody };
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
}

export class DdpResult implements IDdpResult {
  success: boolean;
  private _errors: Record<string, Set<string>>;
  context: Record<string, unknown>;
  readonly exception: Error | null;
  transactionId: string;
  accountLexId?: string;
  sessionId?: string;
  reviewStatus: DdpReviewStatus | null;
  responseBody?: DdpResponseBody;
  client: string;

  constructor(options: DdpResultOptions = {}) {
    this.success = options.success ?? true;
    this._errors = options.errors ?? {};
    this.context = options.context ?? {};
    this.exception = options.exception ?? null;
    this.transactionId = options.transactionId ?? '';
    this.accountLexId = options.accountLexId;
    this.sessionId = options.sessionId;
    this.reviewStatus = options.reviewStatus ?? null;
    this.responseBody = options.responseBody ?? undefined;
    this.client = options.client ?? '';
  }

  /**
   * Add an error to the result
   */
  addError(error: string, key: string = 'base'): this {
    if (!this._errors[key]) {
      this._errors[key] = new Set();
    }
    this._errors[key].add(error);
    return this;
  }

  /**
   * Get errors as arrays (for serialization)
   */
  get errors(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(this._errors)) {
      result[key] = Array.from(value);
    }
    return result;
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return Object.keys(this._errors).length > 0;
  }

  /**
   * Check if there was an exception
   */
  hasException(): boolean {
    return this.exception !== null;
  }

  /**
   * Check if the result failed (has errors but no exception)
   */
  failed(): boolean {
    return !this.hasException() && this.hasErrors();
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
   * Get the device fingerprint from response body
   */
  get deviceFingerprint(): string | undefined {
    return this.responseBody?.fuzzy_device_id;
  }

  /**
   * Convert to a plain object for serialization
   */
  toHash(): Record<string, unknown> {
    return {
      client: this.client,
      success: this.success,
      errors: this.errors,
      exception: this.exception,
      timedOut: this.timedOut,
      transactionId: this.transactionId,
      reviewStatus: this.reviewStatus,
      accountLexId: this.accountLexId,
      sessionId: this.sessionId,
      responseBody: redactResponseBody(this.responseBody ?? null),
    };
  }

  /**
   * Create a failed result from an exception
   */
  static fromException(exception: Error): DdpResult {
    return new DdpResult({
      success: false,
      exception,
    });
  }
}
