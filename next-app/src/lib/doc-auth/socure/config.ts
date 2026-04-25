/**
 * Socure DocAuth configuration
 * Migrated from Rails IdentityConfig.store.socure_* settings
 */

import type { SocureConfig } from './types';

export function getConfigFromEnv(): SocureConfig {
  return {
    apiKey: process.env.SOCURE_IDPLUS_API_KEY || '',
    documentRequestEndpoint:
      process.env.SOCURE_DOCV_DOCUMENT_REQUEST_ENDPOINT || '',
    idplusBaseUrl: process.env.SOCURE_IDPLUS_BASE_URL || '',
    imagesRequestEndpoint:
      process.env.SOCURE_DOCV_IMAGES_REQUEST_ENDPOINT || '',
    flowIdOnly: process.env.IDV_SOCURE_DOCV_FLOW_ID_ONLY || '',
    flowIdWithSelfie: process.env.IDV_SOCURE_DOCV_FLOW_ID_W_SELFIE || '',
    webhookSecretKey: process.env.SOCURE_DOCV_WEBHOOK_SECRET_KEY,
    verificationDataTestMode:
      process.env.SOCURE_DOCV_VERIFICATION_DATA_TEST_MODE === 'true',
    verificationDataTestModeTokens: process.env
      .SOCURE_DOCV_VERIFICATION_DATA_TEST_MODE_TOKENS
      ? process.env.SOCURE_DOCV_VERIFICATION_DATA_TEST_MODE_TOKENS.split(',')
      : [],
    timeout: parseInt(process.env.SOCURE_TIMEOUT || '60000', 10),
    passportVendorSwitchingEnabled:
      process.env.DOC_AUTH_PASSPORT_VENDOR_SWITCHING_ENABLED === 'true',
    passportVendorPercent: parseInt(
      process.env.DOC_AUTH_PASSPORT_VENDOR_SOCURE_PERCENT || '0',
      10
    ),
    passportVendorDefault: process.env.DOC_AUTH_PASSPORT_VENDOR_DEFAULT,
    reasonCodesSelfiePass: process.env.IDV_SOCURE_REASON_CODES_DOCV_SELFIE_PASS
      ? process.env.IDV_SOCURE_REASON_CODES_DOCV_SELFIE_PASS.split(',')
      : ['I850'],
    reasonCodesSelfieFailure: process.env
      .IDV_SOCURE_REASON_CODES_DOCV_SELFIE_FAIL
      ? process.env.IDV_SOCURE_REASON_CODES_DOCV_SELFIE_FAIL.split(',')
      : ['R827', 'R828', 'R829', 'R830', 'R831', 'I848', 'I849'],
    reasonCodesSelfieNotProcessed: process.env
      .IDV_SOCURE_REASON_CODES_DOCV_SELFIE_NOT_PROCESSED
      ? process.env.IDV_SOCURE_REASON_CODES_DOCV_SELFIE_NOT_PROCESSED.split(',')
      : ['I847'],
  };
}

export function validateConfig(config: SocureConfig): void {
  const required: (keyof SocureConfig)[] = [
    'apiKey',
    'documentRequestEndpoint',
    'idplusBaseUrl',
    'flowIdOnly',
    'flowIdWithSelfie',
  ];

  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Socure configuration missing required fields: ${missing.join(', ')}`
    );
  }
}

export const DEFAULT_TIMEOUT = 60000;
export const MAX_RETRIES = 2;
export const RETRY_INTERVAL = 50;
export const RETRY_BACKOFF = 2;
export const RETRY_STATUSES = [404, 500];
