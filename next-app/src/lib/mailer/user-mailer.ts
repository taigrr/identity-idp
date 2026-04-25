/**
 * User Mailer
 * Mirrors: app/mailers/user_mailer.rb
 *
 * Handles all email sending to users
 */

import { sendEmail, type SendResult } from './ses-client';
import {
  emailConfirmationTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  newDeviceSignInTemplate,
  accountResetRequestTemplate,
  accountResetGrantedTemplate,
  accountResetCompleteTemplate,
  accountResetCancelTemplate,
  personalKeyRegeneratedTemplate,
  personalKeySignInTemplate,
  addedEmailTemplate,
  deletedEmailTemplate,
  phoneAddedTemplate,
  verifyByMailLetterRequestedTemplate,
  signupEmailReuseTemplate,
} from './templates';

const APP_NAME = process.env.APP_NAME || 'Login.gov';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://secure.login.gov';

interface User {
  id: number;
  uuid: string;
  email: string;
  emailLanguage?: string;
}

interface EmailAddress {
  email: string;
}

/**
 * UserMailer - handles all user-facing emails
 * 
 * Arguments should NOT include PII directly - use user IDs and look up as needed
 */
export class UserMailer {
  private user: User;
  private emailAddress: EmailAddress;
  private locale: string;

  constructor(user: User, emailAddress: EmailAddress) {
    this.user = user;
    this.emailAddress = emailAddress;
    this.locale = user.emailLanguage || 'en';
  }

  /**
   * Email confirmation instructions for new signups
   */
  async emailConfirmationInstructions(
    token: string,
    requestId: string
  ): Promise<SendResult> {
    const confirmUrl = `${BASE_URL}/sign-up/email/confirm?confirmation_token=${token}&request_id=${requestId}&locale=${this.locale}`;
    
    const { subject, html, text } = emailConfirmationTemplate({
      confirmUrl,
      expirationHours: 24,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Email sent when user tries to sign up with existing email
   */
  async signupWithYourEmail(requestId: string): Promise<SendResult> {
    const signInUrl = `${BASE_URL}/?request_id=${requestId}&locale=${this.locale}`;
    
    const { subject, html, text } = signupEmailReuseTemplate({
      signInUrl,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Password reset instructions
   */
  async resetPasswordInstructions(
    token: string,
    requestId: string
  ): Promise<SendResult> {
    const resetUrl = `${BASE_URL}/users/password/edit?reset_password_token=${token}&request_id=${requestId}&locale=${this.locale}`;
    
    const { subject, html, text } = resetPasswordTemplate({
      resetUrl,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Password changed notification
   */
  async passwordChanged(disavowalToken: string): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = passwordChangedTemplate({
      disavowUrl,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Personal key sign-in notification
   */
  async personalKeySignIn(disavowalToken: string): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = personalKeySignInTemplate({
      disavowUrl,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * New device sign-in notification (after 2FA)
   */
  async newDeviceSignInAfter2fa(
    events: Array<{ eventType: string; occurredAt: Date; ip: string; userAgent: string }>,
    disavowalToken: string
  ): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = newDeviceSignInTemplate({
      events,
      disavowUrl,
      appName: APP_NAME,
      locale: this.locale,
      before2fa: false,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * New device sign-in notification (before 2FA)
   */
  async newDeviceSignInBefore2fa(
    events: Array<{ eventType: string; occurredAt: Date; ip: string; userAgent: string }>,
    disavowalToken: string
  ): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = newDeviceSignInTemplate({
      events,
      disavowUrl,
      appName: APP_NAME,
      locale: this.locale,
      before2fa: true,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Personal key regenerated notification
   */
  async personalKeyRegenerated(): Promise<SendResult> {
    const { subject, html, text } = personalKeyRegeneratedTemplate({
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Account reset request notification
   */
  async accountResetRequest(
    requestToken: string,
    deletionPeriodHours: number
  ): Promise<SendResult> {
    const cancelUrl = `${BASE_URL}/account_reset/cancel?token=${requestToken}`;
    
    const { subject, html, text } = accountResetRequestTemplate({
      cancelUrl,
      deletionPeriodHours,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Account reset granted notification
   */
  async accountResetGranted(
    grantedToken: string,
    tokenValidHours: number
  ): Promise<SendResult> {
    const deleteUrl = `${BASE_URL}/account_reset/delete_account?token=${grantedToken}`;
    
    const { subject, html, text } = accountResetGrantedTemplate({
      deleteUrl,
      tokenValidHours,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Account reset complete notification
   */
  async accountResetComplete(): Promise<SendResult> {
    const { subject, html, text } = accountResetCompleteTemplate({
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Account reset cancel notification
   */
  async accountResetCancel(): Promise<SendResult> {
    const { subject, html, text } = accountResetCancelTemplate({
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Email added notification
   */
  async addedEmail(disavowalToken: string): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = addedEmailTemplate({
      disavowUrl,
      addedEmail: this.emailAddress.email,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Email deleted notification
   */
  async deletedEmail(disavowalToken: string): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = deletedEmailTemplate({
      disavowUrl,
      deletedEmail: this.emailAddress.email,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Phone added notification
   */
  async phoneAdded(disavowalToken: string): Promise<SendResult> {
    const disavowUrl = `${BASE_URL}/events/disavow?disavowal_token=${disavowalToken}`;
    
    const { subject, html, text } = phoneAddedTemplate({
      disavowUrl,
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Verify by mail letter requested notification
   */
  async verifyByMailLetterRequested(): Promise<SendResult> {
    const { subject, html, text } = verifyByMailLetterRequestedTemplate({
      appName: APP_NAME,
      locale: this.locale,
    });

    return sendEmail({
      to: this.emailAddress.email,
      subject,
      html,
      text,
    });
  }
}

/**
 * Factory function to create UserMailer
 */
export function createUserMailer(user: User, emailAddress: EmailAddress): UserMailer {
  return new UserMailer(user, emailAddress);
}
