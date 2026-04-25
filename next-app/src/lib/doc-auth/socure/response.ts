/**
 * Socure DocV Result Response parser
 * Migrated from Rails app/services/doc_auth/socure/responses/docv_result_response.rb
 */

import { DocAuthResponse } from '../response';
import type { PiiFromDoc, SelfieStatus } from '../types';
import type {
  SocureIdPlusResponse,
  SocureConfig,
  SocureSelfieStatus,
} from './types';
import {
  STATE_ID_CLASSIFICATIONS,
  ALL_CLASSIFICATIONS,
  STATE_ID_MAPPINGS,
  PASSPORT_CLASSIFICATIONS,
} from './types';

export interface SocureDocvResultResponseOptions {
  response: SocureIdPlusResponse;
  passportRequested?: boolean;
  config: SocureConfig;
}

export class SocureDocvResultResponse extends DocAuthResponse {
  private response: SocureIdPlusResponse;
  private passportRequested: boolean;
  private config: SocureConfig;
  private parsedPii?: PiiFromDoc;

  constructor(options: SocureDocvResultResponseOptions) {
    const { response, passportRequested = false, config } = options;

    const docAuthSuccess = isDocAuthSuccess(response, passportRequested, config);
    const selfieStatus = determineSelfieStatus(response, config);
    const pii = extractPii(response);
    const errors = buildErrors(response, passportRequested, config, selfieStatus);

    super({
      success: docAuthSuccess,
      errors,
      piiFromDoc: pii,
      selfieStatus: mapSelfieStatus(selfieStatus),
      extra: buildExtraAttributes(response, pii, selfieStatus, docAuthSuccess),
    });

    this.response = response;
    this.passportRequested = passportRequested;
    this.config = config;
    this.parsedPii = pii;
  }

  get docAuthSuccess(): boolean {
    return this.success;
  }

  get referenceId(): string | undefined {
    return this.response.referenceId;
  }

  get reasonCodes(): string[] | undefined {
    return this.response.documentVerification?.reasonCodes;
  }

  get decisionValue(): string | undefined {
    return this.response.documentVerification?.decision?.value;
  }

  get livenessEnabled(): boolean {
    return determineSelfieStatus(this.response, this.config) !== 'not_processed';
  }
}

function isDocAuthSuccess(
  response: SocureIdPlusResponse,
  passportRequested: boolean,
  config: SocureConfig
): boolean {
  return (
    isIdTypeSupported(response, config) &&
    isSuccessfulResult(response) &&
    !isPortraitMatchingFailed(response, config) &&
    isIdTypeExpected(response, passportRequested)
  );
}

function isSuccessfulResult(response: SocureIdPlusResponse): boolean {
  return response.documentVerification?.decision?.value === 'accept';
}

function isIdTypeSupported(
  response: SocureIdPlusResponse,
  config: SocureConfig
): boolean {
  const idType = response.documentVerification?.documentType?.type;
  if (!idType) return false;

  if (passportsEnabled(config)) {
    return ALL_CLASSIFICATIONS.includes(idType);
  }
  return STATE_ID_CLASSIFICATIONS.includes(idType);
}

function isIdTypeExpected(
  response: SocureIdPlusResponse,
  passportRequested: boolean
): boolean {
  const docTypeReceived = getDocumentTypeReceived(response);
  if (docTypeReceived === 'passport') {
    return passportRequested;
  }
  return !passportRequested;
}

function passportsEnabled(config: SocureConfig): boolean {
  return (
    (config.passportVendorSwitchingEnabled &&
      (config.passportVendorPercent || 0) > 0) ||
    config.passportVendorDefault === 'socure'
  );
}

function determineSelfieStatus(
  response: SocureIdPlusResponse,
  config: SocureConfig
): SocureSelfieStatus {
  const reasonCodes = response.documentVerification?.reasonCodes || [];
  const selfieNotProcessed = config.reasonCodesSelfieNotProcessed || [];
  const selfieFail = config.reasonCodesSelfieFailure || [];
  const selfiePass = config.reasonCodesSelfiePass || [];

  if (reasonCodes.some((code) => selfieNotProcessed.includes(code))) {
    return 'not_processed';
  }
  if (reasonCodes.some((code) => selfieFail.includes(code))) {
    return 'fail';
  }
  if (reasonCodes.some((code) => selfiePass.includes(code))) {
    return 'success';
  }
  return 'not_processed';
}

function isPortraitMatchingFailed(
  response: SocureIdPlusResponse,
  config: SocureConfig
): boolean {
  return determineSelfieStatus(response, config) === 'fail';
}

function mapSelfieStatus(status: SocureSelfieStatus): SelfieStatus {
  switch (status) {
    case 'success':
      return 'passed';
    case 'fail':
      return 'failed';
    default:
      return 'not_processed';
  }
}

function getDocumentTypeReceived(response: SocureIdPlusResponse): string {
  const idType = response.documentVerification?.documentType?.type;
  if (!idType) return 'unknown';

  // Convert to snake_case for comparison
  const normalizedType = idType
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();

  // Check mappings
  if (STATE_ID_MAPPINGS[normalizedType]) {
    return STATE_ID_MAPPINGS[normalizedType];
  }

  // Check if passport
  if (PASSPORT_CLASSIFICATIONS.includes(idType)) {
    return 'passport';
  }

  return normalizedType;
}

function extractPii(response: SocureIdPlusResponse): PiiFromDoc {
  const docData = response.documentVerification?.documentData;
  const docType = response.documentVerification?.documentType;
  const docTypeReceived = getDocumentTypeReceived(response);

  if (!docData) return {};

  const isPassport = docTypeReceived === 'passport';

  const pii: PiiFromDoc = {
    firstName: docData.firstName,
    middleName: docData.middleName,
    lastName: docData.surName,
    dob: docData.dob,
    issuingCountryCode: docType?.country,
  };

  if (isPassport) {
    pii.passportNumber = docData.documentNumber;
    pii.passportExpiration = docData.expirationDate;
    // MRZ stored in extra
  } else {
    pii.address1 = docData.parsedAddress?.physicalAddress;
    pii.address2 = docData.parsedAddress?.physicalAddress2;
    pii.city = docData.parsedAddress?.city;
    pii.state = docData.parsedAddress?.state;
    pii.zipCode = docData.parsedAddress?.zip;
    pii.stateIdNumber = docData.documentNumber;
    pii.stateIdIssued = docData.issueDate;
    pii.stateIdExpiration = docData.expirationDate;
    pii.stateIdJurisdiction = docType?.state;
    pii.stateIdType = docTypeReceived;
  }

  return pii;
}

function buildErrors(
  response: SocureIdPlusResponse,
  passportRequested: boolean,
  config: SocureConfig,
  selfieStatus: SocureSelfieStatus
): Record<string, string[]> {
  if (!isIdTypeSupported(response, config)) {
    return { general: ['Unaccepted ID type'] };
  }
  if (!isSuccessfulResult(response)) {
    const reasonCodes = response.documentVerification?.reasonCodes || [];
    return { socure: [`Reason codes: ${reasonCodes.join(', ')}`] };
  }
  if (selfieStatus === 'fail') {
    return { selfie: ['Selfie verification failed'] };
  }
  if (!isIdTypeExpected(response, passportRequested)) {
    return { general: ['Unexpected ID type'] };
  }
  return {};
}

function buildExtraAttributes(
  response: SocureIdPlusResponse,
  pii: PiiFromDoc,
  selfieStatus: SocureSelfieStatus,
  docAuthSuccess: boolean
): Record<string, unknown> {
  const docData = response.documentVerification?.documentData;
  const docType = response.documentVerification?.documentType;

  return {
    addressLine2Present: !!docData?.parsedAddress?.physicalAddress2,
    birthYear: parseBirthYear(pii.dob),
    customerProfile: response.customerProfile,
    customerUserId: response.customerProfile?.customerUserId,
    decision: response.documentVerification?.decision,
    docAuthSuccess,
    documentMetadata: docType,
    documentTypeReceived: getDocumentTypeReceived(response),
    expirationDate: docData?.expirationDate,
    livenessEnabled: selfieStatus !== 'not_processed',
    reasonCodes: response.documentVerification?.reasonCodes,
    referenceId: response.referenceId,
    state: docData?.parsedAddress?.state,
    vendor: 'Socure',
    vendorStatus: response.status,
    vendorStatusMessage: response.msg,
    zipCode: docData?.parsedAddress?.zip,
    mrz: response.documentVerification?.rawData?.mrz,
  };
}

function parseBirthYear(dob?: string): number | undefined {
  if (!dob) return undefined;
  try {
    const date = new Date(dob);
    return isNaN(date.getTime()) ? undefined : date.getFullYear();
  } catch {
    return undefined;
  }
}
