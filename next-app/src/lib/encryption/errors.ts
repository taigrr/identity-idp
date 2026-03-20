/**
 * Custom error class for encryption-related errors
 * Mirrors: app/services/encryption/encryption_error.rb
 */
export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}
