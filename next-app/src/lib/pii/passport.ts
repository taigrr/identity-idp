/**
 * Passport document PII
 * Mirrors: app/services/pii/passport.rb
 */

import type { PiiPassport, PiiAddress, DocumentPii } from './types';

/**
 * Create Passport from raw data
 */
export function createPassport(data: Partial<PiiPassport>): PiiPassport {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    middle_name: data.middle_name,
    dob: data.dob,
    sex: data.sex,
    birth_place: data.birth_place,
    passport_expiration: data.passport_expiration,
    issuing_country_code: data.issuing_country_code,
    mrz: data.mrz,
    passport_issued: data.passport_issued,
    nationality_code: data.nationality_code,
    document_number: data.document_number,
    document_type_received: data.document_type_received,
  };
}

/**
 * Get the ID document type
 */
export function getPassportDocType(passport: PiiPassport): string | undefined {
  return passport.document_type_received;
}

/**
 * Passports always require residential address (they don't contain address info)
 */
export function passportRequiresResidentialAddress(_passport: PiiPassport): boolean {
  return true;
}

/**
 * Convert Passport to PII Address (returns empty address since passports don't have addresses)
 */
export function passportToPiiAddress(_passport: PiiPassport): PiiAddress {
  return {
    address1: null,
    address2: null,
    city: null,
    state: null,
    zipcode: null,
  };
}

/**
 * Passport class implementing DocumentPii interface
 */
export class Passport implements DocumentPii {
  private data: PiiPassport;

  constructor(data: Partial<PiiPassport>) {
    this.data = createPassport(data);
  }

  get firstName(): string | undefined { return this.data.first_name; }
  get lastName(): string | undefined { return this.data.last_name; }
  get middleName(): string | undefined { return this.data.middle_name; }
  get dob(): string | undefined { return this.data.dob; }
  get sex(): string | undefined { return this.data.sex; }
  get birthPlace(): string | undefined { return this.data.birth_place; }
  get passportExpiration(): string | undefined { return this.data.passport_expiration; }
  get issuingCountryCode(): string | undefined { return this.data.issuing_country_code; }
  get mrz(): string | undefined { return this.data.mrz; }
  get passportIssued(): string | undefined { return this.data.passport_issued; }
  get nationalityCode(): string | undefined { return this.data.nationality_code; }
  get documentNumber(): string | undefined { return this.data.document_number; }
  get documentTypeReceived(): string | undefined { return this.data.document_type_received; }

  idDocType(): string | undefined {
    return this.data.document_type_received;
  }

  residentialAddressRequired(): boolean {
    return true;
  }

  toPiiAddress(): PiiAddress {
    return {
      address1: null,
      address2: null,
      city: null,
      state: null,
      zipcode: null,
    };
  }

  toJSON(): PiiPassport {
    return { ...this.data };
  }
}
