/**
 * DocAuth types - mirrors Ruby's DocAuth module types
 * @see app/services/doc_auth/response.rb
 */

import type { DocAuthError } from './errors';

export type SelfieStatus = 'passed' | 'failed' | 'not_processed';

export type DocumentType = 'DriversLicense' | 'Passport' | 'StateIdCard' | 'Unknown';

export type ImageSource = 'acuant_sdk' | 'upload' | 'unknown';

export interface PiiFromDoc {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameSuffix?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  stateIdJurisdiction?: string;
  stateIdNumber?: string;
  stateIdType?: string;
  stateIdIssued?: string;
  stateIdExpiration?: string;
  zipCode?: string;
  dob?: string;
  sex?: string;
  height?: string;
  weight?: string;
  eyeColor?: string;
  issuingCountryCode?: string;
  passportNumber?: string;
  passportIssued?: string;
  passportExpiration?: string;
}

export interface DocAuthResponseOptions {
  success: boolean;
  errors?: Record<string, string[]>;
  exception?: Error | string;
  extra?: Record<string, unknown>;
  piiFromDoc?: PiiFromDoc;
  attentionWithBarcode?: boolean;
  docTypeSupported?: boolean;
  selfieStatus?: SelfieStatus;
  selfieLive?: boolean;
  selfieQualityGood?: boolean;
}

export interface ImageMetrics {
  front?: {
    dpi?: number;
    sharpness?: number;
    glare?: number;
    width?: number;
    height?: number;
  };
  back?: {
    dpi?: number;
    sharpness?: number;
    glare?: number;
    width?: number;
    height?: number;
  };
}

export interface DocAuthResult {
  success: boolean;
  errors: Record<string, string[]>;
  exception?: Error | string;
  extra: Record<string, unknown>;
  piiFromDoc?: PiiFromDoc;
  attentionWithBarcode: boolean;
  docTypeSupported: boolean;
  selfieStatus: SelfieStatus;
  selfieLive: boolean;
  selfieQualityGood: boolean;
  docAuthSuccess: boolean;
  vendorErrors?: Record<string, unknown>;
}

export interface PostImagesRequest {
  frontImage?: Buffer | string;
  backImage?: Buffer | string;
  passportImage?: Buffer | string;
  selfieImage?: Buffer | string;
  documentTypeRequested?: 'DriversLicense' | 'Passport';
  imageSource?: ImageSource;
  imagesCropped?: boolean;
  userUuid?: string;
  uuidPrefix?: string;
  livenessCheckingRequired?: boolean;
  passportRequested?: boolean;
}

export interface DocAuthClientConfig {
  baseUrl: string;
  locale?: string;
  dpiThreshold?: number;
  sharpnessThreshold?: number;
  glareThreshold?: number;
  timeout?: number;
}

export interface DocAuthClient {
  postImages(request: PostImagesRequest): Promise<DocAuthResult>;
}
