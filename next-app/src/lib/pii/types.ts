/**
 * PII Types - Personally Identifiable Information data structures
 * Mirrors: app/services/pii/*.rb
 */

/**
 * Address structure for PII
 * Mirrors: Pii::Address
 */
export interface PiiAddress {
  address1: string | null;
  address2?: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
}

/**
 * Deprecated PII attributes that may still exist in legacy data
 */
export const DEPRECATED_PII_ATTRIBUTES = [
  'otp',
  'prev_address1',
  'prev_address2',
  'prev_city',
  'prev_state',
  'prev_zipcode',
] as const;

/**
 * Core PII Attributes
 * Mirrors: Pii::Attributes
 */
export interface PiiAttributes {
  // Name
  first_name?: string;
  middle_name?: string;
  last_name?: string;

  // Residential address
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  same_address_as_id?: string; // "true" or "false"

  // Identity document address (may differ from residential)
  identity_doc_address1?: string;
  identity_doc_address2?: string;
  identity_doc_city?: string;
  identity_doc_zipcode?: string;
  identity_doc_address_state?: string;

  // State ID jurisdiction (the state that issued the ID)
  state_id_jurisdiction?: string;

  // SSN and DOB
  ssn?: string;
  dob?: string; // YYYY-MM-DD format

  // Phone
  phone?: string;

  // Passport country
  issuing_country_code?: string;

  // Deprecated attributes (for backwards compatibility)
  otp?: string;
  prev_address1?: string;
  prev_address2?: string;
  prev_city?: string;
  prev_state?: string;
  prev_zipcode?: string;
}

/**
 * State ID document PII
 * Mirrors: Pii::StateId
 */
export interface PiiStateId {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  name_suffix?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  dob?: string;
  sex?: string;
  height?: string;
  weight?: string;
  eye_color?: string;
  state_id_expiration?: string;
  state_id_issued?: string;
  state_id_jurisdiction?: string;
  state_id_number?: string;
  document_type_received?: string;
  issuing_country_code?: string;
}

/**
 * Passport document PII
 * Mirrors: Pii::Passport
 */
export interface PiiPassport {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  dob?: string;
  sex?: string;
  birth_place?: string;
  passport_expiration?: string;
  issuing_country_code?: string;
  mrz?: string;
  passport_issued?: string;
  nationality_code?: string;
  document_number?: string;
  document_type_received?: string;
}

/**
 * USPS Applicant data for in-person proofing
 * Mirrors: Pii::UspsApplicant
 */
export interface PiiUspsApplicant {
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  current_address_same_as_id?: string;
  id_number?: string;
  id_expiration?: string;
}

/**
 * Document interface for ID documents
 */
export interface DocumentPii {
  idDocType(): string | undefined;
  residentialAddressRequired(): boolean;
  toPiiAddress(): PiiAddress;
}

/**
 * PII attribute members (for iteration)
 */
export const PII_ATTRIBUTE_MEMBERS: (keyof PiiAttributes)[] = [
  'first_name',
  'middle_name',
  'last_name',
  'address1',
  'address2',
  'city',
  'state',
  'zipcode',
  'same_address_as_id',
  'identity_doc_address1',
  'identity_doc_address2',
  'identity_doc_city',
  'identity_doc_zipcode',
  'identity_doc_address_state',
  'state_id_jurisdiction',
  'ssn',
  'dob',
  'phone',
  'issuing_country_code',
];
