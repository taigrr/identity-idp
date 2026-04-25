/**
 * AAMVA Applicant - Applicant data structure for AAMVA verification
 * Mirrors: app/services/proofing/aamva/applicant.rb
 */

import type { ApplicantPii, StateIdType } from '../types';

/**
 * State ID data structure
 */
export interface StateIdData {
  stateIdNumber: string;
  stateIdJurisdiction: string;
  documentTypeReceived?: StateIdType;
  stateIdIssued?: string;
  stateIdExpiration?: string;
}

/**
 * AAMVA Applicant structure
 */
export interface AamvaApplicant {
  uuid?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  nameSuffix?: string;
  dob: string;
  height?: string;
  sex?: string;
  weight?: string;
  eyeColor?: string;
  stateIdData: StateIdData;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;
}

/**
 * Format date of birth to YYYY-MM-DD format
 */
function formatDob(dob?: string): string {
  if (!dob) return '';

  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return dob;
  }

  // YYYYMMDD format
  if (/^\d{8}$/.test(dob)) {
    return `${dob.slice(0, 4)}-${dob.slice(4, 6)}-${dob.slice(6, 8)}`;
  }

  // MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
    const [month, day, year] = dob.split('/');
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Format height in inches to AAMVA format (e.g., 507 for 5'7")
 */
function formatHeight(heightInInches?: number): string | undefined {
  if (heightInInches === undefined || heightInInches === null) return undefined;

  const feet = Math.floor(heightInInches / 12);
  const inches = Math.floor(heightInInches % 12);

  return `${feet}${String(inches).padStart(2, '0')}`;
}

/**
 * Clean state ID number - remove non-alphanumeric characters
 */
function cleanStateIdNumber(stateIdNumber?: string): string {
  if (!stateIdNumber) return '';
  return stateIdNumber.replace(/[^\w\d]/g, '');
}

/**
 * Create an AAMVA applicant from proofer applicant PII
 */
export function createAamvaApplicant(applicant: ApplicantPii): AamvaApplicant {
  const stateIdData: StateIdData = {
    stateIdNumber: cleanStateIdNumber(applicant.state_id_number),
    stateIdJurisdiction: applicant.state_id_jurisdiction || '',
    documentTypeReceived: applicant.state_id_type,
    stateIdIssued: undefined, // Not commonly provided
    stateIdExpiration: applicant.state_id_expiration,
  };

  return {
    uuid: applicant.uuid,
    firstName: applicant.first_name,
    lastName: applicant.last_name,
    middleName: applicant.middle_name,
    nameSuffix: applicant.name_suffix,
    dob: formatDob(applicant.dob),
    height: undefined, // Would need to be provided separately
    sex: undefined, // Would need to be provided separately
    weight: undefined, // Would need to be provided separately
    eyeColor: undefined, // Would need to be provided separately
    stateIdData,
    address1: applicant.address1,
    address2: applicant.address2,
    city: applicant.city,
    state: applicant.state,
    zipcode: applicant.zipcode?.slice(0, 5),
  };
}

/**
 * Extended applicant with additional physical attributes
 */
export interface ExtendedApplicantPii extends ApplicantPii {
  height_in_inches?: number;
  sex?: 'male' | 'female';
  weight?: string;
  eye_color?: string;
  state_id_issued?: string;
}

/**
 * Create an AAMVA applicant with extended attributes
 */
export function createAamvaApplicantWithExtras(applicant: ExtendedApplicantPii): AamvaApplicant {
  const base = createAamvaApplicant(applicant);

  return {
    ...base,
    height: formatHeight(applicant.height_in_inches),
    sex: applicant.sex,
    weight: applicant.weight,
    eyeColor: applicant.eye_color,
    stateIdData: {
      ...base.stateIdData,
      stateIdIssued: applicant.state_id_issued,
    },
  };
}
