/**
 * Default Rate Limit Configuration
 * Migrated from Rails app/services/rate_limiter.rb
 */

import { RateLimitConfigMap } from './types';

export function createDefaultConfig(env: Record<string, string | number | undefined> = {}): RateLimitConfigMap {
  const getNumber = (key: string, defaultValue: number): number => {
    const value = env[key];
    return typeof value === 'number' ? value : defaultValue;
  };

  return {
    account_reset_request: {
      maxAttempts: getNumber('ACCOUNT_RESET_REQUEST_MAX_ATTEMPTS', 2),
      attemptWindowMinutes: getNumber('ACCOUNT_RESET_REQUEST_ATTEMPT_WINDOW_IN_MINUTES', 1440),
    },
    account_reset_max_attempts: {
      maxAttempts: getNumber('ACCOUNT_RESET_MAX_ATTEMPTS', 3),
      attemptWindowMinutes: getNumber('ACCOUNT_RESET_ATTEMPT_WINDOW_IN_MINUTES', 1440),
    },
    idv_doc_auth: {
      maxAttempts: getNumber('DOC_AUTH_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('DOC_AUTH_ATTEMPT_WINDOW_IN_MINUTES', 1440),
    },
    reg_unconfirmed_email: {
      maxAttempts: getNumber('REG_UNCONFIRMED_EMAIL_MAX_ATTEMPTS', 6),
      attemptWindowMinutes: getNumber('REG_UNCONFIRMED_EMAIL_WINDOW_IN_MINUTES', 10),
    },
    reg_confirmed_email: {
      maxAttempts: getNumber('REG_CONFIRMED_EMAIL_MAX_ATTEMPTS', 6),
      attemptWindowMinutes: getNumber('REG_CONFIRMED_EMAIL_WINDOW_IN_MINUTES', 10),
    },
    reset_password_email: {
      maxAttempts: getNumber('RESET_PASSWORD_EMAIL_MAX_ATTEMPTS', 6),
      attemptWindowMinutes: getNumber('RESET_PASSWORD_EMAIL_WINDOW_IN_MINUTES', 10),
    },
    idv_resolution: {
      maxAttempts: getNumber('IDV_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('IDV_ATTEMPT_WINDOW_IN_HOURS', 24) * 60,
    },
    idv_send_link: {
      maxAttempts: getNumber('IDV_SEND_LINK_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('IDV_SEND_LINK_ATTEMPT_WINDOW_IN_MINUTES', 10),
    },
    verify_personal_key: {
      maxAttempts: getNumber('VERIFY_PERSONAL_KEY_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('VERIFY_PERSONAL_KEY_ATTEMPT_WINDOW_IN_MINUTES', 10),
    },
    verify_gpo_key: {
      maxAttempts: getNumber('VERIFY_GPO_KEY_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('VERIFY_GPO_KEY_ATTEMPT_WINDOW_IN_MINUTES', 10),
    },
    proof_ssn: {
      maxAttempts: getNumber('PROOF_SSN_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('PROOF_SSN_MAX_ATTEMPT_WINDOW_IN_MINUTES', 60),
    },
    proof_address: {
      maxAttempts: getNumber('PROOF_ADDRESS_MAX_ATTEMPTS', 5),
      attemptWindowMinutes: getNumber('PROOF_ADDRESS_MAX_ATTEMPT_WINDOW_IN_MINUTES', 60),
    },
    phone_confirmation: {
      maxAttempts: getNumber('PHONE_CONFIRMATION_MAX_ATTEMPTS', 10),
      attemptWindowMinutes: getNumber('PHONE_CONFIRMATION_MAX_ATTEMPT_WINDOW_IN_MINUTES', 10),
    },
    phone_otp: {
      maxAttempts: getNumber('OTP_DELIVERY_BLOCKLIST_MAXRETRY', 10) + 1,
      attemptWindowMinutes: getNumber('OTP_DELIVERY_BLOCKLIST_FINDTIME', 5),
    },
    short_term_phone_otp: {
      maxAttempts: getNumber('SHORT_TERM_PHONE_OTP_MAX_ATTEMPTS', 3),
      attemptWindowMinutes: getNumber('SHORT_TERM_PHONE_OTP_MAX_ATTEMPT_WINDOW_IN_SECONDS', 60) / 60,
    },
    sign_in_user_id_per_ip: {
      maxAttempts: getNumber('SIGN_IN_USER_ID_PER_IP_MAX_ATTEMPTS', 10),
      attemptWindowMinutes: getNumber('SIGN_IN_USER_ID_PER_IP_ATTEMPT_WINDOW_IN_MINUTES', 10),
      attemptWindowExponentialFactor: getNumber('SIGN_IN_USER_ID_PER_IP_ATTEMPT_WINDOW_EXPONENTIAL_FACTOR', 2),
      attemptWindowMaxMinutes: getNumber('SIGN_IN_USER_ID_PER_IP_ATTEMPT_WINDOW_MAX_MINUTES', 1440),
    },
    backup_code_user_id_per_ip: {
      maxAttempts: getNumber('BACKUP_CODE_USER_ID_PER_IP_MAX_ATTEMPTS', 10),
      attemptWindowMinutes: getNumber('BACKUP_CODE_USER_ID_PER_IP_ATTEMPT_WINDOW_IN_MINUTES', 10),
      attemptWindowExponentialFactor: getNumber('BACKUP_CODE_USER_ID_PER_IP_ATTEMPT_WINDOW_EXPONENTIAL_FACTOR', 2),
      attemptWindowMaxMinutes: getNumber('BACKUP_CODE_USER_ID_PER_IP_ATTEMPT_WINDOW_MAX_MINUTES', 1440),
    },
  };
}
