/**
 * Push Notification Events - RISC security events
 * Mirrors: app/services/push_notification/*_event.rb
 */

import type {
  PushNotificationUser,
  PushNotificationEvent,
  RiscEventPayload,
  IssSubSubject,
  EmailSubject,
  RiscEventType,
} from './types';
import { RISC_EVENT_TYPES, getPushNotificationConfig } from './types';

/**
 * Base class for IssSubject events
 */
abstract class IssSubEvent implements PushNotificationEvent {
  constructor(public user: PushNotificationUser) {}

  abstract get eventType(): RiscEventType;

  payload(issSub: string): RiscEventPayload {
    const config = getPushNotificationConfig();
    return {
      subject: {
        subject_type: 'iss-sub',
        iss: config.rootUrl,
        sub: issSub,
      } as IssSubSubject,
    };
  }
}

/**
 * Account Purged Event - Sent when an account is deleted
 * Mirrors: PushNotification::AccountPurgedEvent
 */
export class AccountPurgedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.ACCOUNT_PURGED;
  }
}

/**
 * Account Disabled Event - Sent when an account is disabled
 * Mirrors: PushNotification::AccountDisabledEvent
 */
export class AccountDisabledEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.ACCOUNT_DISABLED;
  }
}

/**
 * Account Enabled Event - Sent when an account is re-enabled
 * Mirrors: PushNotification::AccountEnabledEvent
 */
export class AccountEnabledEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.ACCOUNT_ENABLED;
  }
}

/**
 * Password Reset Event - Sent when a password is reset
 * Mirrors: PushNotification::PasswordResetEvent
 */
export class PasswordResetEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.PASSWORD_RESET;
  }
}

/**
 * Email Changed Event - Sent when an email is changed
 * Mirrors: PushNotification::EmailChangedEvent
 */
export class EmailChangedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.EMAIL_CHANGED;
  }
}

/**
 * Recovery Activated Event - Sent when account recovery is activated
 * Mirrors: PushNotification::RecoveryActivatedEvent
 */
export class RecoveryActivatedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.RECOVERY_ACTIVATED;
  }
}

/**
 * Recovery Information Changed Event - Sent when recovery info changes
 * Mirrors: PushNotification::RecoveryInformationChangedEvent
 */
export class RecoveryInformationChangedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.RECOVERY_INFORMATION_CHANGED;
  }
}

/**
 * MFA Limit Account Locked Event - Sent when account is locked due to MFA failures
 * Mirrors: PushNotification::MfaLimitAccountLockedEvent
 */
export class MfaLimitAccountLockedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.MFA_LIMIT_ACCOUNT_LOCKED;
  }
}

/**
 * Reproof Completed Event - Sent when identity reproof is completed
 * Mirrors: PushNotification::ReproofCompletedEvent
 */
export class ReproofCompletedEvent extends IssSubEvent {
  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.REPROOF_COMPLETED;
  }
}

/**
 * Identifier Recycled Event - Sent when an email is recycled to new user
 * Uses email subject type instead of iss-sub
 * Mirrors: PushNotification::IdentifierRecycledEvent
 */
export class IdentifierRecycledEvent implements PushNotificationEvent {
  constructor(
    public user: PushNotificationUser,
    public email: string
  ) {}

  get eventType(): RiscEventType {
    return RISC_EVENT_TYPES.IDENTIFIER_RECYCLED;
  }

  payload(_issSub: string): RiscEventPayload {
    return {
      subject: {
        subject_type: 'email',
        email: this.email,
      } as EmailSubject,
    };
  }
}

/**
 * Factory functions for creating events
 */
export function createAccountPurgedEvent(user: PushNotificationUser): AccountPurgedEvent {
  return new AccountPurgedEvent(user);
}

export function createAccountDisabledEvent(user: PushNotificationUser): AccountDisabledEvent {
  return new AccountDisabledEvent(user);
}

export function createAccountEnabledEvent(user: PushNotificationUser): AccountEnabledEvent {
  return new AccountEnabledEvent(user);
}

export function createPasswordResetEvent(user: PushNotificationUser): PasswordResetEvent {
  return new PasswordResetEvent(user);
}

export function createEmailChangedEvent(user: PushNotificationUser): EmailChangedEvent {
  return new EmailChangedEvent(user);
}

export function createRecoveryActivatedEvent(user: PushNotificationUser): RecoveryActivatedEvent {
  return new RecoveryActivatedEvent(user);
}

export function createRecoveryInformationChangedEvent(user: PushNotificationUser): RecoveryInformationChangedEvent {
  return new RecoveryInformationChangedEvent(user);
}

export function createMfaLimitAccountLockedEvent(user: PushNotificationUser): MfaLimitAccountLockedEvent {
  return new MfaLimitAccountLockedEvent(user);
}

export function createReproofCompletedEvent(user: PushNotificationUser): ReproofCompletedEvent {
  return new ReproofCompletedEvent(user);
}

export function createIdentifierRecycledEvent(
  user: PushNotificationUser,
  email: string
): IdentifierRecycledEvent {
  return new IdentifierRecycledEvent(user, email);
}
