/**
 * Account Reset Types
 * Mirrors: app/services/account_reset/*.rb
 */

import { randomUUID } from 'crypto';

/**
 * User for account reset operations
 */
export interface AccountResetUser {
  id: string;
  uuid: string;
  confirmed_email_addresses: Array<{ id: string; email: string }>;
  confirmed_at?: Date;
  fraud_review_pending?: boolean;
  fraud_rejection?: boolean;
  identity_verified?: boolean;
  active_profile?: {
    id: string;
    idv_level?: string;
    facial_match?: boolean;
  };
}

/**
 * Account reset request record
 */
export interface AccountResetRequest {
  id: string;
  user_id: string;
  user?: AccountResetUser;
  request_token: string | null;
  requested_at: Date | null;
  cancelled_at: Date | null;
  granted_at: Date | null;
  granted_token: string | null;
  requesting_issuer: string | null;
}

/**
 * Form response for account reset operations
 */
export interface AccountResetFormResponse {
  success: boolean;
  errors?: Record<string, string[]>;
  extra?: Record<string, unknown>;
}

/**
 * Dependencies for account reset services
 */
export interface AccountResetDependencies {
  // Database operations
  findOrCreateRequest: (userId: string) => Promise<AccountResetRequest>;
  updateRequest: (requestId: string, data: Partial<AccountResetRequest>) => Promise<AccountResetRequest>;
  findRequestByUserId: (userId: string) => Promise<AccountResetRequest | null>;
  findRequestByToken: (token: string, tokenType: 'request' | 'granted') => Promise<AccountResetRequest | null>;
  deleteUser: (userId: string) => Promise<void>;
  createDeletedUser: (user: AccountResetUser) => Promise<void>;

  // Mailer
  sendAccountResetRequestEmail: (user: AccountResetUser, request: AccountResetRequest) => Promise<void>;
  sendAccountResetCancelEmail: (user: AccountResetUser) => Promise<void>;
  sendAccountResetCompleteEmail: (user: AccountResetUser) => Promise<void>;

  // SMS
  sendAccountResetNoticeSms?: (phone: string, countryCode: string, interval: string) => Promise<{ requestId?: string; messageId?: string }>;
  sendAccountResetCancellationSms?: (phone: string, countryCode: string) => Promise<{ requestId?: string; messageId?: string }>;

  // Push notifications
  sendAccountPurgedNotification?: (user: AccountResetUser) => Promise<void>;

  // Analytics
  analytics?: {
    oneAccountSelfService?: (data: Record<string, unknown>) => void;
  };

  // Utilities
  getUserPhone: (userId: string) => Promise<string | null>;
  getMfaMethodCounts: (userId: string) => Promise<Record<string, number>>;
}

/**
 * Account reset configuration
 */
export interface AccountResetConfig {
  deletionPeriodDays: number;
  fraudUserWaitPeriodDays: number | null;
  grantedTokenValidHours: number;
}

/**
 * Get account reset config from environment
 */
export function getAccountResetConfig(): AccountResetConfig {
  const fraudWaitDays = process.env.ACCOUNT_RESET_FRAUD_USER_WAIT_PERIOD_DAYS;
  return {
    deletionPeriodDays: Number(process.env.ACCOUNT_RESET_DELETION_PERIOD_DAYS) || 7,
    fraudUserWaitPeriodDays: fraudWaitDays ? Number(fraudWaitDays) : null,
    grantedTokenValidHours: Number(process.env.ACCOUNT_RESET_GRANTED_TOKEN_VALID_HOURS) || 24,
  };
}

/**
 * Generate a secure token
 */
export function generateToken(): string {
  return randomUUID();
}

/**
 * Calculate deletion period interval as human-readable string
 */
export function getDeletionPeriodInterval(): string {
  const config = getAccountResetConfig();
  const days = config.deletionPeriodDays;
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
}
