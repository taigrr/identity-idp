/**
 * Socure DocAuth types
 * Migrated from Rails app/services/doc_auth/socure/
 */

export type SocureDocumentType = 'passport' | 'license';

export type SocureSelfieStatus = 'success' | 'fail' | 'not_processed';

export type SocureDecisionValue = 'accept' | 'reject' | 'review';

export interface SocureConfig {
  apiKey: string;
  documentRequestEndpoint: string;
  idplusBaseUrl: string;
  imagesRequestEndpoint: string;
  flowIdOnly: string;
  flowIdWithSelfie: string;
  webhookSecretKey?: string;
  verificationDataTestMode?: boolean;
  verificationDataTestModeTokens?: string[];
  timeout?: number;
  passportVendorSwitchingEnabled?: boolean;
  passportVendorPercent?: number;
  passportVendorDefault?: string;
  reasonCodesSelfiePass?: string[];
  reasonCodesSelfieFailure?: string[];
  reasonCodesSelfieNotProcessed?: string[];
}

export interface SocureDocumentRequestParams {
  customerUserId: string;
  redirectUrl: string;
  language: string;
  livenessCheckingRequired?: boolean;
  passportRequested?: boolean;
}

export interface SocureDocumentRequestResponse {
  url: string;
  docvTransactionToken: string;
  referenceId?: string;
}

export interface SocureDocvResultRequestParams {
  customerUserId: string;
  documentCaptureSessionUuid: string;
  userEmail: string;
  docvTransactionToken: string;
  passportRequested?: boolean;
}

export interface SocureImagesRequestParams {
  referenceId: string;
  passportBook?: boolean;
}

export interface SocureIdPlusResponse {
  referenceId?: string;
  status?: string;
  msg?: string;
  documentVerification?: {
    decision?: {
      name?: string;
      value?: SocureDecisionValue;
    };
    reasonCodes?: string[];
    documentType?: {
      type?: string;
      state?: string;
      country?: string;
    };
    documentData?: {
      firstName?: string;
      middleName?: string;
      surName?: string;
      dob?: string;
      documentNumber?: string;
      issueDate?: string;
      expirationDate?: string;
      parsedAddress?: {
        physicalAddress?: string;
        physicalAddress2?: string;
        city?: string;
        state?: string;
        zip?: string;
      };
    };
    rawData?: {
      mrz?: string;
    };
  };
  customerProfile?: {
    customerUserId?: string;
    userId?: string;
  };
}

export interface SocureImages {
  front?: Buffer;
  back?: Buffer;
  passport?: Buffer;
  selfie?: Buffer;
}

export interface SocureWebhookPayload {
  event?: {
    eventType?: string;
    docvTransactionToken?: string;
    referenceId?: string;
    customerUserId?: string;
  };
  created?: string;
}

// Document classifications matching Rails
export const STATE_ID_CLASSIFICATIONS = [
  'DriversLicense',
  'IdentificationCard',
  'DriversPermit',
  'ProvincialDrivingPermit',
];

export const PASSPORT_CLASSIFICATIONS = ['Passport', 'PassportCard'];

export const ALL_CLASSIFICATIONS = [
  ...STATE_ID_CLASSIFICATIONS,
  ...PASSPORT_CLASSIFICATIONS,
];

// State ID type mapping (Socure -> Login.gov)
export const STATE_ID_MAPPINGS: Record<string, string> = {
  identification_card: 'state_id_card',
};
