/**
 * Application configuration
 * Mirrors: config/application.yml and IdentityConfig.store
 */

export interface AppConfig {
  // AWS
  awsRegion: string;
  awsKmsKeyId: string;
  awsKmsMultiRegionKeyId: string;
  awsKmsSessionKeyId: string;

  // Feature flags
  useKms: boolean;

  // Encryption
  passwordPepper: string;
  sessionEncryptionKey: string;
  scryptCost: string;

  // Database
  databaseUrl: string;

  // Redis
  redisUrl: string;

  // Session
  sessionEncryptorAlertEnabled: boolean;
}

let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (configInstance) {
    return configInstance;
  }

  configInstance = {
    // AWS - defaults for local development
    awsRegion: process.env.AWS_REGION ?? 'us-west-2',
    awsKmsKeyId: process.env.AWS_KMS_KEY_ID ?? 'local-dev-key',
    awsKmsMultiRegionKeyId:
      process.env.AWS_KMS_MULTI_REGION_KEY_ID ?? 'local-dev-multi-region-key',
    awsKmsSessionKeyId:
      process.env.AWS_KMS_SESSION_KEY_ID ?? 'local-dev-session-key',

    // Feature flags - disable KMS for local dev
    useKms: process.env.USE_KMS === 'true',

    // Encryption - MUST be set in production
    passwordPepper:
      process.env.PASSWORD_PEPPER ?? 'local-dev-pepper-do-not-use-in-prod',
    sessionEncryptionKey:
      process.env.SESSION_ENCRYPTION_KEY ??
      'local-dev-session-key-32-chars!!',
    scryptCost: process.env.SCRYPT_COST ?? '10000$8$1$',

    // Database
    databaseUrl:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/identity_idp_development',

    // Redis
    redisUrl: process.env.REDIS_URL ?? 'redis://:redispassword@localhost:6379/0',

    // Session
    sessionEncryptorAlertEnabled:
      process.env.SESSION_ENCRYPTOR_ALERT_ENABLED === 'true',
  };

  return configInstance;
}

/**
 * Reset config (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
