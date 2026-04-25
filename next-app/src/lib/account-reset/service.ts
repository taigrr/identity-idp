/**
 * Account Reset Service - Operations for account reset flow
 * Mirrors: app/services/account_reset/*.rb
 */

import type {
  AccountResetUser,
  AccountResetRequest,
  AccountResetFormResponse,
  AccountResetDependencies,
} from './types';
import {
  generateToken,
  getAccountResetConfig,
  getDeletionPeriodInterval,
} from './types';

/**
 * Create Account Reset Request
 * Mirrors: AccountReset::CreateRequest
 */
export async function createAccountResetRequest(
  user: AccountResetUser,
  requestingIssuer: string,
  deps: AccountResetDependencies
): Promise<AccountResetFormResponse> {
  // Create or update request
  const request = await deps.findOrCreateRequest(user.id);
  const updatedRequest = await deps.updateRequest(request.id, {
    request_token: generateToken(),
    requested_at: new Date(),
    cancelled_at: null,
    granted_at: null,
    granted_token: null,
    requesting_issuer: requestingIssuer,
  });

  // Notify user by email
  await deps.sendAccountResetRequestEmail(user, updatedRequest);

  // Notify user by SMS if applicable
  let extra: Record<string, unknown> = {};
  const phone = await deps.getUserPhone(user.id);
  if (phone && deps.sendAccountResetNoticeSms) {
    const countryCode = extractCountryCode(phone);
    const interval = getDeletionPeriodInterval();
    const result = await deps.sendAccountResetNoticeSms(phone, countryCode, interval);
    extra = {
      request_id: result.requestId,
      message_id: result.messageId,
    };
  }

  return {
    success: true,
    extra,
  };
}

/**
 * Grant Account Reset Request
 * Mirrors: AccountReset::GrantRequest
 */
export async function grantAccountResetRequest(
  user: AccountResetUser,
  deps: AccountResetDependencies
): Promise<boolean> {
  const request = await deps.findRequestByUserId(user.id);
  if (!request) {
    return false;
  }

  // Check if fraud user and wait period not met
  if (isFraudUser(user) && !isFraudWaitPeriodMet(request)) {
    return false;
  }

  // Check if already has valid granted token
  if (isGrantedTokenValid(request)) {
    return true;
  }

  // Grant the request
  const token = generateToken();
  await deps.updateRequest(request.id, {
    granted_at: new Date(),
    granted_token: token,
  });

  return true;
}

/**
 * Cancel Account Reset Request
 * Mirrors: AccountReset::Cancel
 */
export async function cancelAccountReset(
  token: string,
  deps: AccountResetDependencies
): Promise<AccountResetFormResponse> {
  const request = await deps.findRequestByToken(token, 'request');

  if (!request || !request.user) {
    return {
      success: false,
      errors: { token: ['Invalid or expired token'] },
    };
  }

  const user = request.user;

  // Notify user by email
  await deps.sendAccountResetCancelEmail(user);

  // Notify user by phone
  let extra: Record<string, unknown> = { user_id: user.uuid };
  const phone = await deps.getUserPhone(user.id);
  if (phone && deps.sendAccountResetCancellationSms) {
    const countryCode = extractCountryCode(phone);
    const result = await deps.sendAccountResetCancellationSms(phone, countryCode);
    extra = {
      ...extra,
      request_id: result.requestId,
      message_id: result.messageId,
    };
  }

  // Update request
  await deps.updateRequest(request.id, {
    cancelled_at: new Date(),
    request_token: null,
    granted_token: null,
  });

  return {
    success: true,
    extra,
  };
}

/**
 * Delete Account
 * Mirrors: AccountReset::DeleteAccount
 */
export async function deleteAccount(
  token: string,
  deps: AccountResetDependencies
): Promise<AccountResetFormResponse> {
  const request = await deps.findRequestByToken(token, 'granted');

  if (!request || !request.user || !isGrantedTokenValid(request)) {
    return {
      success: false,
      errors: { token: ['Invalid or expired token'] },
    };
  }

  const user = request.user;

  // Calculate account age
  let accountAgeInDays: number | undefined;
  if (user.confirmed_at) {
    const now = new Date();
    const confirmedAt = user.confirmed_at;
    const diffMs = now.getTime() - confirmedAt.getTime();
    accountAgeInDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  // Get MFA method counts
  const mfaMethodCounts = await deps.getMfaMethodCounts(user.id);

  // Notify user via email before deletion
  await deps.sendAccountResetCompleteEmail(user);

  // Send push notifications
  if (deps.sendAccountPurgedNotification) {
    await deps.sendAccountPurgedNotification(user);
  }

  // Create deleted user record and delete user
  await deps.createDeletedUser(user);
  await deps.deleteUser(user.id);

  return {
    success: true,
    extra: {
      user_id: user.uuid,
      email: user.confirmed_email_addresses[0]?.email,
      account_age_in_days: accountAgeInDays,
      account_confirmed_at: user.confirmed_at,
      mfa_method_counts: mfaMethodCounts,
      profile_idv_level: user.active_profile?.idv_level,
      identity_verified: user.identity_verified,
    },
  };
}

/**
 * Find pending request for user
 * Mirrors: AccountReset::PendingRequestForUser
 */
export async function findPendingRequestForUser(
  user: AccountResetUser,
  deps: AccountResetDependencies
): Promise<AccountResetRequest | null> {
  const request = await deps.findRequestByUserId(user.id);

  if (!request) {
    return null;
  }

  // Request is pending if it has a requested_at but no granted_at and no cancelled_at
  if (request.requested_at && !request.granted_at && !request.cancelled_at) {
    return request;
  }

  return null;
}

/**
 * Validate cancel token
 * Mirrors: AccountReset::ValidateCancelToken
 */
export async function validateCancelToken(
  token: string,
  deps: AccountResetDependencies
): Promise<{ valid: boolean; request?: AccountResetRequest }> {
  const request = await deps.findRequestByToken(token, 'request');

  if (!request) {
    return { valid: false };
  }

  // Token is valid if request exists and hasn't been cancelled
  if (!request.cancelled_at) {
    return { valid: true, request };
  }

  return { valid: false };
}

/**
 * Validate granted token
 * Mirrors: AccountReset::ValidateGrantedToken
 */
export async function validateGrantedToken(
  token: string,
  deps: AccountResetDependencies
): Promise<{ valid: boolean; request?: AccountResetRequest }> {
  const request = await deps.findRequestByToken(token, 'granted');

  if (!request) {
    return { valid: false };
  }

  if (isGrantedTokenValid(request)) {
    return { valid: true, request };
  }

  return { valid: false };
}

// Helper functions

/**
 * Check if user is a fraud user
 */
function isFraudUser(user: AccountResetUser): boolean {
  return !!user.fraud_review_pending || !!user.fraud_rejection;
}

/**
 * Check if fraud wait period has been met
 */
function isFraudWaitPeriodMet(request: AccountResetRequest): boolean {
  const config = getAccountResetConfig();

  if (config.fraudUserWaitPeriodDays === null) {
    return true;
  }

  if (!request.requested_at) {
    return false;
  }

  const waitPeriodMs = config.fraudUserWaitPeriodDays * 24 * 60 * 60 * 1000;
  const requestedAt = request.requested_at;
  const now = new Date();

  return now.getTime() - requestedAt.getTime() >= waitPeriodMs;
}

/**
 * Check if granted token is still valid
 */
function isGrantedTokenValid(request: AccountResetRequest): boolean {
  if (!request.granted_token || !request.granted_at) {
    return false;
  }

  const config = getAccountResetConfig();
  const validPeriodMs = config.grantedTokenValidHours * 60 * 60 * 1000;
  const grantedAt = request.granted_at;
  const now = new Date();

  return now.getTime() - grantedAt.getTime() < validPeriodMs;
}

/**
 * Extract country code from phone number
 */
function extractCountryCode(phone: string): string {
  // Simple extraction - assumes E.164 format
  if (phone.startsWith('+1')) {
    return 'US';
  }
  return 'US';
}
