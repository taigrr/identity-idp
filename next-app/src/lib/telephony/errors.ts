/**
 * Telephony Errors
 * Mirrors: lib/telephony/errors.rb
 */

export class TelephonyError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'TelephonyError';
    this.code = code;
    this.retryable = retryable;
  }
}

export class DuplicateEndpointError extends TelephonyError {
  constructor(message = 'Duplicate endpoint') {
    super(message, 'DUPLICATE', false);
    this.name = 'DuplicateEndpointError';
  }
}

export class OptOutError extends TelephonyError {
  constructor(message = 'Phone number has opted out of SMS') {
    super(message, 'OPT_OUT', false);
    this.name = 'OptOutError';
  }
}

export class PermanentFailureError extends TelephonyError {
  constructor(message = 'Permanent delivery failure') {
    super(message, 'PERMANENT_FAILURE', false);
    this.name = 'PermanentFailureError';
  }
}

export class TemporaryFailureError extends TelephonyError {
  constructor(message = 'Temporary delivery failure') {
    super(message, 'TEMPORARY_FAILURE', true);
    this.name = 'TemporaryFailureError';
  }
}

export class RateLimitedError extends TelephonyError {
  constructor(message = 'Rate limited') {
    super(message, 'THROTTLED', true);
    this.name = 'RateLimitedError';
  }
}

export class TimeoutError extends TelephonyError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT', true);
    this.name = 'TimeoutError';
  }
}

export class UnknownFailureError extends TelephonyError {
  constructor(message = 'Unknown failure') {
    super(message, 'UNKNOWN_FAILURE', false);
    this.name = 'UnknownFailureError';
  }
}

export class InvalidPhoneNumberError extends TelephonyError {
  constructor(message = 'Invalid phone number') {
    super(message, 'INVALID_PHONE', false);
    this.name = 'InvalidPhoneNumberError';
  }
}

export class ConfigurationError extends TelephonyError {
  constructor(message = 'Telephony not configured') {
    super(message, 'NOT_CONFIGURED', false);
    this.name = 'ConfigurationError';
  }
}

/**
 * Map Pinpoint delivery status to error class
 */
export const PINPOINT_ERROR_MAP: Record<string, new (message?: string) => TelephonyError> = {
  'DUPLICATE': DuplicateEndpointError,
  'OPT_OUT': OptOutError,
  'PERMANENT_FAILURE': PermanentFailureError,
  'TEMPORARY_FAILURE': TemporaryFailureError,
  'THROTTLED': RateLimitedError,
  'TIMEOUT': TimeoutError,
  'UNKNOWN_FAILURE': UnknownFailureError,
};

/**
 * Create error from Pinpoint delivery status
 */
export function createErrorFromDeliveryStatus(
  status: string,
  message?: string
): TelephonyError | null {
  const ErrorClass = PINPOINT_ERROR_MAP[status];
  if (ErrorClass) {
    return new ErrorClass(message);
  }
  return null;
}
