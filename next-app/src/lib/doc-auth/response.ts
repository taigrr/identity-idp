/**
 * DocAuth Response class - mirrors Ruby's DocAuth::Response
 * @see app/services/doc_auth/response.rb
 */

import type {
  DocAuthResponseOptions,
  DocAuthResult,
  PiiFromDoc,
  SelfieStatus,
} from './types';

export class DocAuthResponse implements DocAuthResult {
  readonly success: boolean;
  readonly errors: Record<string, string[]>;
  readonly exception?: Error | string;
  readonly extra: Record<string, unknown>;
  readonly piiFromDoc?: PiiFromDoc;
  readonly attentionWithBarcode: boolean;
  readonly docTypeSupported: boolean;
  readonly selfieStatus: SelfieStatus;
  readonly selfieLive: boolean;
  readonly selfieQualityGood: boolean;
  vendorErrors?: Record<string, unknown>;

  constructor(options: DocAuthResponseOptions) {
    this.success = options.success;
    this.errors = options.errors || {};
    this.exception = options.exception;
    this.extra = options.extra || {};
    this.piiFromDoc = options.piiFromDoc;
    this.attentionWithBarcode = options.attentionWithBarcode ?? false;
    this.docTypeSupported = options.docTypeSupported ?? true;
    this.selfieStatus = options.selfieStatus ?? 'not_processed';
    this.selfieLive = options.selfieLive ?? true;
    this.selfieQualityGood = options.selfieQualityGood ?? true;
  }

  get docAuthSuccess(): boolean {
    return false;
  }

  isSuccess(): boolean {
    return this.success;
  }

  isDocTypeSupported(): boolean {
    return this.docTypeSupported;
  }

  isSelfieLive(): boolean {
    return this.selfieLive;
  }

  isSelfieQualityGood(): boolean {
    return this.selfieQualityGood;
  }

  toJSON(): DocAuthResult {
    return {
      success: this.success,
      errors: this.errors,
      exception: this.exception,
      extra: this.extra,
      piiFromDoc: this.piiFromDoc,
      attentionWithBarcode: this.attentionWithBarcode,
      docTypeSupported: this.docTypeSupported,
      selfieStatus: this.selfieStatus,
      selfieLive: this.selfieLive,
      selfieQualityGood: this.selfieQualityGood,
      docAuthSuccess: this.docAuthSuccess,
      vendorErrors: this.vendorErrors,
    };
  }

  firstErrorMessage(): string | undefined {
    if (Object.keys(this.errors).length === 0) return undefined;
    const [, messages] = Object.entries(this.errors)[0];
    return Array.isArray(messages) ? messages[0] : messages;
  }

  isAttentionWithBarcode(): boolean {
    return this.attentionWithBarcode;
  }

  isNetworkError(): boolean {
    return !!this.errors?.network;
  }

  selfieCheckPerformed(): boolean {
    return false;
  }

  extraAttributes(): Record<string, unknown> {
    return {};
  }
}
