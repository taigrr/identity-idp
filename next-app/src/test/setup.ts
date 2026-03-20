import '@testing-library/jest-dom/vitest';

// Mock environment variables for tests
process.env.PASSWORD_PEPPER = 'test-pepper-for-testing-only';
process.env.SESSION_ENCRYPTION_KEY = 'test-session-key-32-characters!!';
process.env.AWS_REGION = 'us-west-2';
process.env.AWS_KMS_KEY_ID = 'test-kms-key';
process.env.AWS_KMS_MULTI_REGION_KEY_ID = 'test-kms-multi-region-key';
process.env.AWS_KMS_SESSION_KEY_ID = 'test-kms-session-key';
process.env.USE_KMS = 'false';
process.env.SCRYPT_COST = '1024$8$1$'; // Low cost for fast tests
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379/0';
