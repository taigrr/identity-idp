/**
 * Analytics Events - mirrors AnalyticsEvents module from Rails
 * @see app/services/analytics_events.rb
 *
 * This file contains typed event methods that call trackEvent with proper attributes.
 * Methods are organized alphabetically to match Rails convention.
 */

import { Analytics, AnalyticsOptions } from './analytics';
import type {
  FormValidationResult,
  ProofingComponents,
  MfaMethodCounts,
  FlowPath,
  DocumentType,
  ErrorDetails,
} from './types';

export class AnalyticsWithEvents extends Analytics {
  constructor(options: AnalyticsOptions = {}) {
    super(options);
  }

  // Account events

  accountCreationTmxResult(params: {
    success: boolean;
    client?: string;
    errors?: string[];
    exception?: string;
    timedOut: boolean;
    transactionId: string;
    reviewStatus: string;
    accountLexId: string;
    sessionId: string;
    responseBody: Record<string, unknown>;
  }): void {
    this.trackEvent('account_creation_tmx_result', params);
  }

  accountDeleteSubmitted(params: { success: boolean }): void {
    this.trackEvent('Account Delete submitted', params);
  }

  accountDeleteVisited(): void {
    this.trackEvent('Account Delete visited');
  }

  accountDeletion(params: { requestCameFrom: string }): void {
    this.trackEvent('Account Deletion Requested', {
      request_came_from: params.requestCameFrom,
    });
  }

  accountResetCancel(params: {
    success: boolean;
    userId: string;
    errors?: Record<string, string[]>;
    errorDetails?: ErrorDetails;
    messageId?: string;
    requestId?: string;
  }): void {
    this.trackEvent('Account Reset: cancel', {
      success: params.success,
      user_id: params.userId,
      errors: params.errors,
      error_details: params.errorDetails,
      message_id: params.messageId,
      request_id: params.requestId,
    });
  }

  accountResetDelete(params: {
    success: boolean;
    userId: string;
    accountAgeInDays?: number;
    accountConfirmedAt?: Date;
    mfaMethodCounts: MfaMethodCounts;
    identityVerified: boolean;
    profileIdvLevel?: string;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Account Reset: delete', {
      success: params.success,
      user_id: params.userId,
      account_age_in_days: params.accountAgeInDays,
      account_confirmed_at: params.accountConfirmedAt,
      mfa_method_counts: params.mfaMethodCounts,
      identity_verified: params.identityVerified,
      profile_idv_level: params.profileIdvLevel,
      error_details: params.errorDetails,
    });
  }

  accountResetRequest(params: {
    success: boolean;
    smsPhone: boolean;
    totp: boolean;
    pivCac: boolean;
    emailAddresses: number;
    requestId?: string;
    messageId?: string;
  }): void {
    this.trackEvent('Account Reset: request', {
      success: params.success,
      sms_phone: params.smsPhone,
      totp: params.totp,
      piv_cac: params.pivCac,
      email_addresses: params.emailAddresses,
      request_id: params.requestId,
      message_id: params.messageId,
    });
  }

  accountResetVisit(): void {
    this.trackEvent('Account deletion and reset visited');
  }

  accountVisit(): void {
    this.trackEvent('Account Page Visited');
  }

  // Authentication events

  emailAndPasswordAuth(params: {
    success: boolean;
    userLockedOut: boolean;
    rateLimited: boolean;
    validCaptchaResult: boolean;
    captchaValidationPerformed: boolean;
    signInFailureCount: number;
    spRequestUrlPresent: boolean;
    rememberDevice: boolean;
    newDevice?: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Email and Password Authentication', {
      success: params.success,
      user_locked_out: params.userLockedOut,
      rate_limited: params.rateLimited,
      valid_captcha_result: params.validCaptchaResult,
      captcha_validation_performed: params.captchaValidationPerformed,
      sign_in_failure_count: params.signInFailureCount,
      sp_request_url_present: params.spRequestUrlPresent,
      remember_device: params.rememberDevice,
      new_device: params.newDevice,
      error_details: params.errorDetails,
    });
  }

  authenticationConfirmation(): void {
    this.trackEvent('Authentication Confirmation');
  }

  authenticationConfirmationContinue(): void {
    this.trackEvent('Authentication Confirmation: Continue selected');
  }

  authenticationConfirmationReset(): void {
    this.trackEvent('Authentication Confirmation: Reset selected');
  }

  // Email events

  addEmailConfirmation(params: {
    userId: string;
    success: boolean;
    fromSelectEmailFlow: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Add Email: Email Confirmation', {
      user_id: params.userId,
      success: params.success,
      from_select_email_flow: params.fromSelectEmailFlow,
      error_details: params.errorDetails,
    });
  }

  addEmailRequest(params: {
    success: boolean;
    domainName: string;
    inSelectEmailFlow: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Add Email Requested', {
      success: params.success,
      domain_name: params.domainName,
      in_select_email_flow: params.inSelectEmailFlow,
      error_details: params.errorDetails,
    });
  }

  addEmailVisit(params: { inSelectEmailFlow: boolean }): void {
    this.trackEvent('Add Email Address Page Visited', {
      in_select_email_flow: params.inSelectEmailFlow,
    });
  }

  emailDeletionRequest(params: FormValidationResult): void {
    this.trackEvent('Email Deletion Requested', { ...params });
  }

  emailSent(params: { action: string; sesMessageId?: string; emailAddressId: number }): void {
    this.trackEvent('Email Sent', {
      action: params.action,
      ses_message_id: params.sesMessageId,
      email_address_id: params.emailAddressId,
    });
  }

  // MFA events

  addPhoneSetupVisit(): void {
    this.trackEvent('Phone Setup Visited');
  }

  authAppDeleteSubmitted(params: {
    success: boolean;
    configurationId: number;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('auth_app_delete_submitted', {
      success: params.success,
      configuration_id: params.configurationId,
      error_details: params.errorDetails,
    });
  }

  backupCodeCreated(params: {
    enabledMfaMethodsCount: number;
    inAccountCreationFlow: boolean;
  }): void {
    this.trackEvent('Backup Code Created', {
      enabled_mfa_methods_count: params.enabledMfaMethodsCount,
      in_account_creation_flow: params.inAccountCreationFlow,
    });
  }

  backupCodeSetupVisit(params: {
    success: boolean;
    mfaMethodCounts: MfaMethodCounts;
    enabledMfaMethodsCount: number;
    inAccountCreationFlow: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Backup Code Setup Visited', {
      success: params.success,
      mfa_method_counts: params.mfaMethodCounts,
      enabled_mfa_methods_count: params.enabledMfaMethodsCount,
      in_account_creation_flow: params.inAccountCreationFlow,
      error_details: params.errorDetails,
    });
  }

  // Sign in/out events

  signInPageVisit(): void {
    this.trackEvent('Sign in page visited');
  }

  signOutCompleted(): void {
    this.trackEvent('Sign out completed');
  }

  // User registration events

  userRegistrationEmail(params: {
    success: boolean;
    rateLimited: boolean;
    validCaptchaResult: boolean;
    domainName: string;
    emailAlreadyExists: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('User Registration: Email Submitted', {
      success: params.success,
      rate_limited: params.rateLimited,
      valid_captcha_result: params.validCaptchaResult,
      domain_name: params.domainName,
      email_already_exists: params.emailAlreadyExists,
      error_details: params.errorDetails,
    });
  }

  userRegistrationEmailConfirmation(params: {
    success: boolean;
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('User Registration: Email Confirmation', {
      success: params.success,
      error_details: params.errorDetails,
    });
  }

  userRegistrationComplete(): void {
    this.trackEvent('User Registration: complete');
  }

  // Password events

  editPasswordVisit(params: { requiredPasswordChange?: boolean }): void {
    this.trackEvent('Edit Password Page Visited', {
      required_password_change: params.requiredPasswordChange,
    });
  }

  passwordChanged(): void {
    this.trackEvent('Password Changed');
  }

  passwordCreation(params: FormValidationResult): void {
    this.trackEvent('Password Creation', { ...params });
  }

  passwordReset(params: FormValidationResult): void {
    this.trackEvent('Password Reset', { ...params });
  }

  // Personal key events

  personalKeyViewed(): void {
    this.trackEvent('Personal Key Viewed');
  }

  personalKeyAcknowledged(): void {
    this.trackEvent('Personal Key Acknowledged');
  }

  personalKeyRegenerated(): void {
    this.trackEvent('Personal Key: Regenerated');
  }

  // Phone events

  phoneSetupVisited(): void {
    this.trackEvent('Phone Setup Visited');
  }

  multiFactorAuthPhoneSetup(params: {
    success: boolean;
    otp_delivery_preference: 'sms' | 'voice';
    area_code?: string;
    carrier?: string;
    phone_type?: string;
    types?: string[];
    errorDetails?: ErrorDetails;
  }): void {
    this.trackEvent('Multi-Factor Authentication: phone setup', params);
  }

  // Events page
  eventsVisit(): void {
    this.trackEvent('Events Page Visited');
  }

  // Completions
  completionsCancellationVisited(): void {
    this.trackEvent('completions_cancellation_visited');
  }

  // Connected accounts
  connectedAccountsPageVisited(): void {
    this.trackEvent('connected_accounts_page_visited');
  }

  // New device alert
  createNewDeviceAlertJobEmailsSent(params: { count: number }): void {
    this.trackEvent('create_new_device_alert_job_emails_sent', { count: params.count });
  }

  // Forget browsers
  forgetAllBrowsersSubmitted(): void {
    this.trackEvent('Forget All Browsers Submitted');
  }

  forgetAllBrowsersVisited(): void {
    this.trackEvent('Forget All Browsers Visited');
  }
}
