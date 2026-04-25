/**
 * USPS Applicant for in-person proofing
 * Mirrors: app/services/pii/usps_applicant.rb
 */

import type { PiiUspsApplicant, PiiAttributes } from './types';

/**
 * Create USPS Applicant from raw data
 */
export function createUspsApplicant(data: Partial<PiiUspsApplicant>): PiiUspsApplicant {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    state: data.state,
    zipcode: data.zipcode,
    current_address_same_as_id: data.current_address_same_as_id,
    id_number: data.id_number,
    id_expiration: data.id_expiration,
  };
}

/**
 * Create USPS Applicant from IDV applicant data
 * Mirrors: Pii::UspsApplicant.from_idv_applicant
 */
export function createUspsApplicantFromIdvApplicant(
  applicant: Record<string, string | undefined>
): PiiUspsApplicant {
  return {
    first_name: applicant['first_name'],
    last_name: applicant['last_name'],
    address1: applicant['identity_doc_address1'],
    address2: applicant['identity_doc_address2'],
    city: applicant['identity_doc_city'],
    state: applicant['identity_doc_address_state'],
    zipcode: applicant['identity_doc_zipcode'],
    id_expiration: applicant['state_id_expiration'],
    id_number: applicant['state_id_number'],
    current_address_same_as_id: applicant['same_address_as_id'],
  };
}

/**
 * Create USPS Applicant from PII Attributes
 */
export function createUspsApplicantFromPiiAttributes(
  attrs: PiiAttributes
): PiiUspsApplicant {
  return {
    first_name: attrs.first_name,
    last_name: attrs.last_name,
    address1: attrs.identity_doc_address1,
    address2: attrs.identity_doc_address2,
    city: attrs.identity_doc_city,
    state: attrs.identity_doc_address_state,
    zipcode: attrs.identity_doc_zipcode,
    current_address_same_as_id: attrs.same_address_as_id,
    id_number: undefined, // Not in PiiAttributes
    id_expiration: undefined, // Not in PiiAttributes
  };
}

/**
 * Check if address line 2 is present
 */
export function hasAddressLine2(applicant: PiiUspsApplicant): boolean {
  return !!applicant.address2 && applicant.address2.trim().length > 0;
}

/**
 * USPS Applicant class
 */
export class UspsApplicant {
  private data: PiiUspsApplicant;

  constructor(data: Partial<PiiUspsApplicant>) {
    this.data = createUspsApplicant(data);
  }

  static fromIdvApplicant(applicant: Record<string, string | undefined>): UspsApplicant {
    return new UspsApplicant(createUspsApplicantFromIdvApplicant(applicant));
  }

  static fromPiiAttributes(attrs: PiiAttributes): UspsApplicant {
    return new UspsApplicant(createUspsApplicantFromPiiAttributes(attrs));
  }

  get firstName(): string | undefined { return this.data.first_name; }
  get lastName(): string | undefined { return this.data.last_name; }
  get address1(): string | undefined { return this.data.address1; }
  get address2(): string | undefined { return this.data.address2; }
  get city(): string | undefined { return this.data.city; }
  get state(): string | undefined { return this.data.state; }
  get zipcode(): string | undefined { return this.data.zipcode; }
  get currentAddressSameAsId(): string | undefined { return this.data.current_address_same_as_id; }
  get idNumber(): string | undefined { return this.data.id_number; }
  get idExpiration(): string | undefined { return this.data.id_expiration; }

  addressLine2Present(): boolean {
    return hasAddressLine2(this.data);
  }

  toJSON(): PiiUspsApplicant {
    return { ...this.data };
  }
}
