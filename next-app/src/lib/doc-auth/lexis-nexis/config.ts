/**
 * LexisNexis TrueID config - mirrors Ruby's DocAuth::LexisNexis::Config
 * @see app/services/doc_auth/lexis_nexis/config.rb
 */

export interface LexisNexisConfig {
  accountId?: string;
  baseUrl: string;
  requestMode?: string;
  trueidAccountId?: string;
  trueidNoLivenessCroppingWorkflow?: string;
  trueidNoLivenessNoCroppingWorkflow?: string;
  trueidLivenessCroppingWorkflow?: string;
  trueidLivenessNoCroppingWorkflow?: string;
  trueidPassword?: string;
  trueidUsername?: string;
  hmacKeyId?: string;
  hmacSecretKey?: string;
  locale: string;
  dpiThreshold: number;
  sharpnessThreshold: number;
  glareThreshold: number;
  timeout?: number;
}

export function validateConfig(config: LexisNexisConfig): void {
  if (!config.baseUrl) {
    throw new Error('LexisNexis config missing baseUrl');
  }
  if (!config.locale) {
    throw new Error('LexisNexis config missing locale');
  }
}

export function getConfigFromEnv(): LexisNexisConfig {
  return {
    accountId: process.env.LEXISNEXIS_ACCOUNT_ID,
    baseUrl: process.env.LEXISNEXIS_BASE_URL || '',
    requestMode: process.env.LEXISNEXIS_REQUEST_MODE,
    trueidAccountId: process.env.LEXISNEXIS_TRUEID_ACCOUNT_ID,
    trueidNoLivenessCroppingWorkflow:
      process.env.LEXISNEXIS_TRUEID_NOLIVENESS_CROPPING_WORKFLOW,
    trueidNoLivenessNoCroppingWorkflow:
      process.env.LEXISNEXIS_TRUEID_NOLIVENESS_NOCROPPING_WORKFLOW,
    trueidLivenessCroppingWorkflow:
      process.env.LEXISNEXIS_TRUEID_LIVENESS_CROPPING_WORKFLOW,
    trueidLivenessNoCroppingWorkflow:
      process.env.LEXISNEXIS_TRUEID_LIVENESS_NOCROPPING_WORKFLOW,
    trueidPassword: process.env.LEXISNEXIS_TRUEID_PASSWORD,
    trueidUsername: process.env.LEXISNEXIS_TRUEID_USERNAME,
    hmacKeyId: process.env.LEXISNEXIS_HMAC_KEY_ID,
    hmacSecretKey: process.env.LEXISNEXIS_HMAC_SECRET_KEY,
    locale: process.env.LEXISNEXIS_LOCALE || 'en',
    dpiThreshold: parseInt(process.env.LEXISNEXIS_DPI_THRESHOLD || '290', 10),
    sharpnessThreshold: parseInt(process.env.LEXISNEXIS_SHARPNESS_THRESHOLD || '40', 10),
    glareThreshold: parseInt(process.env.LEXISNEXIS_GLARE_THRESHOLD || '40', 10),
    timeout: parseInt(process.env.LEXISNEXIS_TIMEOUT || '60000', 10),
  };
}
