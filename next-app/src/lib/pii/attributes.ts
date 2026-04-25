/**
 * PII Attributes - Core PII data structure with utilities
 * Mirrors: app/services/pii/attributes.rb
 */

import type { PiiAttributes, PiiAddress, PII_ATTRIBUTE_MEMBERS } from './types';

/**
 * Create PII Attributes from a hash/object
 * Mirrors: Pii::Attributes.new_from_hash
 */
export function createPiiAttributesFromHash(hash: Record<string, unknown>): PiiAttributes {
  const attrs: PiiAttributes = {};

  const members: (keyof PiiAttributes)[] = [
    'first_name', 'middle_name', 'last_name',
    'address1', 'address2', 'city', 'state', 'zipcode', 'same_address_as_id',
    'identity_doc_address1', 'identity_doc_address2', 'identity_doc_city',
    'identity_doc_zipcode', 'identity_doc_address_state',
    'state_id_jurisdiction', 'ssn', 'dob', 'phone', 'issuing_country_code',
    // deprecated
    'otp', 'prev_address1', 'prev_address2', 'prev_city', 'prev_state', 'prev_zipcode',
  ];

  for (const key of members) {
    const value = hash[key];
    if (value !== undefined && value !== null) {
      // Squish strings (collapse whitespace)
      if (typeof value === 'string') {
        attrs[key] = value.trim().replace(/\s+/g, ' ');
      } else {
        attrs[key] = String(value);
      }
    }
  }

  return attrs;
}

/**
 * Create PII Attributes from JSON string
 * Mirrors: Pii::Attributes.new_from_json
 */
export function createPiiAttributesFromJson(piiJson: string | null | undefined): PiiAttributes {
  if (!piiJson || piiJson.trim() === '') {
    return {};
  }

  try {
    const parsed = JSON.parse(piiJson);
    return createPiiAttributesFromHash(parsed);
  } catch {
    return {};
  }
}

/**
 * Convert PII Attributes to JSON string
 */
export function piiAttributesToJson(attrs: PiiAttributes): string {
  return JSON.stringify(attrs);
}

/**
 * Check equality of two PII Attributes
 */
export function piiAttributesEqual(a: PiiAttributes, b: PiiAttributes): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Create PII Address from attributes
 */
export function createPiiAddress(attrs: Partial<PiiAddress>): PiiAddress {
  return {
    address1: attrs.address1 ?? null,
    address2: attrs.address2,
    city: attrs.city ?? null,
    state: attrs.state ?? null,
    zipcode: attrs.zipcode ?? null,
  };
}

/**
 * Merge two PII Attributes objects
 */
export function mergePiiAttributes(base: PiiAttributes, override: PiiAttributes): PiiAttributes {
  const result: PiiAttributes = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && value !== null) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Redact sensitive fields from PII for logging
 */
export function redactPii(attrs: PiiAttributes): Record<string, string> {
  const redacted: Record<string, string> = {};
  const sensitiveFields = ['ssn', 'dob', 'phone'];

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (sensitiveFields.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (key.includes('address') || key === 'city' || key === 'state' || key === 'zipcode') {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = String(value);
    }
  }

  return redacted;
}

/**
 * Extract address from PII attributes
 */
export function extractAddress(attrs: PiiAttributes): PiiAddress {
  return {
    address1: attrs.address1 ?? null,
    address2: attrs.address2,
    city: attrs.city ?? null,
    state: attrs.state ?? null,
    zipcode: attrs.zipcode ?? null,
  };
}

/**
 * Extract identity document address from PII attributes
 */
export function extractIdentityDocAddress(attrs: PiiAttributes): PiiAddress {
  return {
    address1: attrs.identity_doc_address1 ?? null,
    address2: attrs.identity_doc_address2,
    city: attrs.identity_doc_city ?? null,
    state: attrs.identity_doc_address_state ?? null,
    zipcode: attrs.identity_doc_zipcode ?? null,
  };
}

/**
 * Check if same address as ID flag is set
 */
export function isSameAddressAsId(attrs: PiiAttributes): boolean {
  return attrs.same_address_as_id === 'true';
}

/**
 * Normalize SSN to 9 digits without dashes
 */
export function normalizeSsn(ssn: string | undefined | null): string | undefined {
  if (!ssn) return undefined;
  return ssn.replace(/\D/g, '');
}

/**
 * Format SSN with dashes (XXX-XX-XXXX)
 */
export function formatSsn(ssn: string | undefined | null): string | undefined {
  const normalized = normalizeSsn(ssn);
  if (!normalized || normalized.length !== 9) {
    return ssn ?? undefined;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 5)}-${normalized.slice(5)}`;
}

/**
 * Validate PII attributes have required fields
 */
export function validatePiiAttributes(attrs: PiiAttributes): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!attrs.first_name?.trim()) {
    errors.push('first_name is required');
  }

  if (!attrs.last_name?.trim()) {
    errors.push('last_name is required');
  }

  if (!attrs.dob?.trim()) {
    errors.push('dob is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
