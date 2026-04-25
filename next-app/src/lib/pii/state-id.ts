/**
 * State ID document PII
 * Mirrors: app/services/pii/state_id.rb
 */

import type { PiiStateId, PiiAddress, DocumentPii } from './types';
import { createPiiAddress } from './attributes';

/**
 * Create State ID from raw data
 */
export function createStateId(data: Partial<PiiStateId>): PiiStateId {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    middle_name: data.middle_name,
    name_suffix: data.name_suffix,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    state: data.state,
    zipcode: data.zipcode,
    dob: data.dob,
    sex: data.sex,
    height: data.height,
    weight: data.weight,
    eye_color: data.eye_color,
    state_id_expiration: data.state_id_expiration,
    state_id_issued: data.state_id_issued,
    state_id_jurisdiction: data.state_id_jurisdiction,
    state_id_number: data.state_id_number,
    document_type_received: data.document_type_received,
    issuing_country_code: data.issuing_country_code,
  };
}

/**
 * Get the ID document type
 */
export function getStateIdDocType(stateId: PiiStateId): string | undefined {
  return stateId.document_type_received;
}

/**
 * Check if residential address is required for this document
 * Puerto Rico IDs require residential address
 */
export function stateIdRequiresResidentialAddress(stateId: PiiStateId): boolean {
  return stateId.state === 'PR';
}

/**
 * Convert State ID to PII Address
 */
export function stateIdToPiiAddress(stateId: PiiStateId): PiiAddress {
  return createPiiAddress({
    address1: stateId.address1 ?? null,
    address2: stateId.address2,
    city: stateId.city ?? null,
    state: stateId.state ?? null,
    zipcode: stateId.zipcode ?? null,
  });
}

/**
 * State ID class implementing DocumentPii interface
 */
export class StateId implements DocumentPii {
  private data: PiiStateId;

  constructor(data: Partial<PiiStateId>) {
    this.data = createStateId(data);
  }

  get firstName(): string | undefined { return this.data.first_name; }
  get lastName(): string | undefined { return this.data.last_name; }
  get middleName(): string | undefined { return this.data.middle_name; }
  get nameSuffix(): string | undefined { return this.data.name_suffix; }
  get address1(): string | undefined { return this.data.address1; }
  get address2(): string | undefined { return this.data.address2; }
  get city(): string | undefined { return this.data.city; }
  get state(): string | undefined { return this.data.state; }
  get zipcode(): string | undefined { return this.data.zipcode; }
  get dob(): string | undefined { return this.data.dob; }
  get sex(): string | undefined { return this.data.sex; }
  get height(): string | undefined { return this.data.height; }
  get weight(): string | undefined { return this.data.weight; }
  get eyeColor(): string | undefined { return this.data.eye_color; }
  get stateIdExpiration(): string | undefined { return this.data.state_id_expiration; }
  get stateIdIssued(): string | undefined { return this.data.state_id_issued; }
  get stateIdJurisdiction(): string | undefined { return this.data.state_id_jurisdiction; }
  get stateIdNumber(): string | undefined { return this.data.state_id_number; }
  get documentTypeReceived(): string | undefined { return this.data.document_type_received; }
  get issuingCountryCode(): string | undefined { return this.data.issuing_country_code; }

  idDocType(): string | undefined {
    return this.data.document_type_received;
  }

  residentialAddressRequired(): boolean {
    return this.data.state === 'PR';
  }

  toPiiAddress(): PiiAddress {
    return {
      address1: this.data.address1 ?? null,
      address2: this.data.address2,
      city: this.data.city ?? null,
      state: this.data.state ?? null,
      zipcode: this.data.zipcode ?? null,
    };
  }

  toJSON(): PiiStateId {
    return { ...this.data };
  }
}
