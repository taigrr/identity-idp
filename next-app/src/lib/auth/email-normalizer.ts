/**
 * Email Normalizer
 * Migrated from Rails app/services/email_normalizer.rb
 * 
 * Normalizes email addresses, handling Gmail-style + addressing
 * and dot variations.
 */

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

export interface EmailNormalizerOptions {
  checkMxRecords?: boolean;
  isGoogleMxRecord?: (domain: string) => Promise<boolean>;
}

export function normalizeEmail(
  email: string,
  options: EmailNormalizerOptions = {}
): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  
  if (atIndex === -1) {
    return trimmed;
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (isGmailDomain(domain)) {
    return normalizeGmailAddress(local, domain);
  }

  return trimmed;
}

export async function normalizeEmailAsync(
  email: string,
  options: EmailNormalizerOptions = {}
): Promise<string> {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  
  if (atIndex === -1) {
    return trimmed;
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (isGmailDomain(domain)) {
    return normalizeGmailAddress(local, domain);
  }

  if (options.checkMxRecords && options.isGoogleMxRecord) {
    const isGoogle = await options.isGoogleMxRecord(domain);
    if (isGoogle) {
      return normalizeGmailAddress(local, domain);
    }
  }

  return trimmed;
}

function isGmailDomain(domain: string): boolean {
  return GMAIL_DOMAINS.includes(domain);
}

function normalizeGmailAddress(local: string, domain: string): string {
  const [beforePlus] = local.split('+', 1);
  const normalizedLocal = beforePlus.replace(/\./g, '');
  return `${normalizedLocal}@${domain}`;
}

export function extractEmailParts(email: string): { local: string; domain: string } | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  
  if (atIndex === -1 || atIndex === 0 || atIndex === trimmed.length - 1) {
    return null;
  }

  return {
    local: trimmed.slice(0, atIndex),
    domain: trimmed.slice(atIndex + 1),
  };
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
