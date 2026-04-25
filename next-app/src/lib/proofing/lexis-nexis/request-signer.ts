/**
 * LexisNexis Request Signer - HMAC authentication for LexisNexis API
 * Mirrors: app/services/proofing/lexis_nexis/request_signer.rb
 */

import { createHmac } from 'crypto';
import { randomUUID } from 'crypto';

export interface SignerConfig {
  baseUrl: string;
  hmacKeyId: string;
  hmacSecretKey: string;
}

/**
 * Create HMAC authorization header for LexisNexis API
 * Based on RDP_REST_V3_DecisioningGuide_March22.pdf, page 21
 */
export function createHmacAuthorization(
  config: SignerConfig,
  messageBody: string,
  path: string,
  timestamp?: string,
  nonce?: string
): string {
  const ts = timestamp ?? Date.now().toString();
  const nonceValue = nonce ?? randomUUID();
  const host = config.baseUrl.replace('https://', '');

  // Calculate body hash
  const bodyHash = createHmac('sha256', config.hmacSecretKey)
    .update(messageBody)
    .digest('base64');

  // Build signature
  const signatureMessage = [ts, nonceValue, host, path, bodyHash].join('\n');
  const signature = createHmac('sha256', config.hmacSecretKey)
    .update(signatureMessage)
    .digest('base64');

  // Build authorization header
  return [
    'HMAC-SHA256',
    `keyid=${config.hmacKeyId},`,
    `ts=${ts},`,
    `nonce=${nonceValue},`,
    `bodyHash=${bodyHash},`,
    `signature=${signature}`,
  ].join(' ');
}

/**
 * Request signer class for more complex use cases
 */
export class RequestSigner {
  private config: SignerConfig;
  private messageBody: string;
  private path: string;
  private host: string;

  constructor(config: SignerConfig, messageBody: string, path: string) {
    this.config = config;
    this.messageBody = messageBody;
    this.path = path;
    this.host = config.baseUrl.replace('https://', '');
  }

  /**
   * Get HMAC authorization header
   */
  getAuthorization(timestamp?: string, nonce?: string): string {
    return createHmacAuthorization(
      this.config,
      this.messageBody,
      this.path,
      timestamp,
      nonce
    );
  }
}
