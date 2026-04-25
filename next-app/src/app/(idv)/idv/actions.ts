/**
 * IDV Actions
 * Mirrors: app/controllers/idv/*.rb
 */

'use server';

import { redirect } from 'next/navigation';
import { updateIdvSession, clearIdvSession, type IdvPii } from '@/lib/idv/session';
import { randomUUID } from 'crypto';

// Re-export type for use by pages
export type { IdvPii };

export async function startIdv(): Promise<void> {
  await clearIdvSession();
  
  await updateIdvSession({
    welcomeVisited: true,
    proofingStartedAt: new Date().toISOString(),
    documentCaptureSessionUuid: randomUUID(),
  });

  redirect('/idv/agreement');
}

export async function submitAgreement(formData: FormData): Promise<void> {
  const consent = formData.get('idv_consent_given') === 'true';

  if (!consent) {
    // In a real app, we'd return an error state
    return;
  }

  await updateIdvSession({
    idvConsentGivenAt: new Date().toISOString(),
    flowPath: 'standard',
  });

  redirect('/idv/document-capture');
}

export async function submitDocumentCapture(): Promise<void> {
  // In a real implementation, this would process the uploaded document images
  // and extract PII from them using a document verification service
  
  // For now, we'll mark the step as complete
  // The actual document processing would happen via a separate API
  
  redirect('/idv/ssn');
}

export async function submitSsn(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const ssn = formData.get('ssn') as string;
  
  // Validate SSN format
  const cleanSsn = ssn.replace(/\D/g, '');
  if (cleanSsn.length !== 9) {
    return { success: false, error: 'Please enter a valid 9-digit Social Security number' };
  }

  // Check for invalid SSN patterns (900-999 range, 000, etc.)
  const ssnArea = cleanSsn.substring(0, 3);
  const ssnGroup = cleanSsn.substring(3, 5);
  const ssnSerial = cleanSsn.substring(5, 9);

  if (
    ssnArea === '000' ||
    ssnArea === '666' ||
    parseInt(ssnArea) >= 900 ||
    ssnGroup === '00' ||
    ssnSerial === '0000'
  ) {
    return { success: false, error: 'Please enter a valid Social Security number' };
  }

  await updateIdvSession({
    ssn: cleanSsn,
    ssnComplete: true,
  });

  return { success: true };
}

export async function submitVerifyInfo(): Promise<{ success: boolean; error?: string }> {
  // In a real implementation, this would:
  // 1. Submit PII to resolution/verification services
  // 2. Check against fraud indicators
  // 3. Verify against authoritative sources
  
  await updateIdvSession({
    verifyInfoComplete: true,
    resolutionSuccessful: true,
    resolutionVendor: 'mock',
  });

  return { success: true };
}

export async function submitPhone(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const phone = formData.get('phone') as string;
  const deliveryMethod = formData.get('delivery_method') as 'sms' | 'voice';

  // Validate phone
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid phone number' };
  }

  // In a real implementation, this would:
  // 1. Verify the phone number is associated with the user
  // 2. Send an OTP for confirmation
  
  await updateIdvSession({
    addressVerificationMechanism: 'phone',
    vendorPhoneConfirmation: true,
  });

  return { success: true };
}

export async function requestGpoLetter(): Promise<{ success: boolean; error?: string }> {
  // In a real implementation, this would enqueue a letter to be mailed
  
  await updateIdvSession({
    addressVerificationMechanism: 'gpo',
    verifyByMail: true,
    gpoCodeSentAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function verifyPhoneOtp(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const otp = formData.get('otp') as string;

  // In a real implementation, this would verify the OTP
  if (otp.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit code' };
  }

  await updateIdvSession({
    userPhoneConfirmation: true,
    phoneComplete: true,
  });

  return { success: true };
}

export async function generatePersonalKey(): Promise<string> {
  // Generate a personal key for account recovery
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  const personalKey = segments.join('-');

  await updateIdvSession({
    personalKey,
    verifiedAt: new Date().toISOString(),
  });

  return personalKey;
}

export async function acknowledgePersonalKey(): Promise<void> {
  // Mark IDV as complete and redirect to account
  redirect('/account?idv=complete');
}

export async function saveDocumentCapturePii(pii: IdvPii): Promise<{ success: boolean }> {
  await updateIdvSession({
    piiFromDoc: pii,
    documentCaptureComplete: true,
  });

  return { success: true };
}
