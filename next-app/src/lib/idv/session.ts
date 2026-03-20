/**
 * IDV Session Management
 * Mirrors: app/services/idv/session.rb
 */

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';

export interface IdvPii {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
  stateIdNumber?: string;
  stateIdType?: 'drivers_license' | 'state_id_card' | 'passport';
  stateIdJurisdiction?: string;
}

export interface IdvSessionData {
  // Step completion tracking
  welcomeVisited?: boolean;
  idvConsentGivenAt?: string;
  documentCaptureComplete?: boolean;
  ssnComplete?: boolean;
  verifyInfoComplete?: boolean;
  phoneComplete?: boolean;

  // Document capture
  documentCaptureSessionUuid?: string;
  flowPath?: 'standard' | 'hybrid';
  skipHybridHandoff?: boolean;

  // PII from document
  piiFromDoc?: IdvPii;
  ssn?: string;
  previousSsn?: string;

  // Phone verification
  vendorPhoneConfirmation?: boolean;
  userPhoneConfirmation?: boolean;
  addressVerificationMechanism?: 'phone' | 'gpo';

  // Resolution/verification status
  resolutionSuccessful?: boolean;
  resolutionVendor?: string;
  threatmetrixReviewStatus?: 'pass' | 'review' | 'reject';

  // Proofing timestamps
  proofingStartedAt?: string;
  verifiedAt?: string;

  // GPO/mail verification
  verifyByMail?: boolean;
  gpoCode?: string;
  gpoCodeSentAt?: string;

  // Personal key
  personalKey?: string;
}

export async function getIdvSession(): Promise<IdvSessionData | null> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return null;
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return null;
  }

  return (session as Record<string, unknown>).idvSession as IdvSessionData || {};
}

export async function updateIdvSession(updates: Partial<IdvSessionData>): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return false;
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return false;
  }

  const currentIdvSession = (session as Record<string, unknown>).idvSession as IdvSessionData || {};
  
  await sessionManager.update(sessionId, {
    ...session,
    idvSession: {
      ...currentIdvSession,
      ...updates,
    },
  });

  return true;
}

export async function clearIdvSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return false;
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return false;
  }

  // Keep mail_only_warning_shown when clearing
  const currentIdvSession = (session as Record<string, unknown>).idvSession as IdvSessionData || {};
  
  await sessionManager.update(sessionId, {
    ...session,
    idvSession: {},
  });

  return true;
}

// Step completion checks
export function isWelcomeComplete(session: IdvSessionData): boolean {
  return !!session.welcomeVisited;
}

export function isAgreementComplete(session: IdvSessionData): boolean {
  return !!session.idvConsentGivenAt;
}

export function isDocumentCaptureComplete(session: IdvSessionData): boolean {
  return !!session.documentCaptureComplete && !!session.piiFromDoc;
}

export function isSsnComplete(session: IdvSessionData): boolean {
  return !!session.ssnComplete && !!session.ssn;
}

export function isVerifyInfoComplete(session: IdvSessionData): boolean {
  return !!session.verifyInfoComplete && !!session.resolutionSuccessful;
}

export function isPhoneComplete(session: IdvSessionData): boolean {
  return !!session.phoneComplete || session.addressVerificationMechanism === 'gpo';
}

// Flow navigation
export function getIdvStepUrl(session: IdvSessionData): string {
  if (!isWelcomeComplete(session)) {
    return '/idv';
  }
  if (!isAgreementComplete(session)) {
    return '/idv/agreement';
  }
  if (!isDocumentCaptureComplete(session)) {
    return '/idv/document-capture';
  }
  if (!isSsnComplete(session)) {
    return '/idv/ssn';
  }
  if (!isVerifyInfoComplete(session)) {
    return '/idv/verify-info';
  }
  if (!isPhoneComplete(session)) {
    return '/idv/phone';
  }
  return '/idv/personal-key';
}
