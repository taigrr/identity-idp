/**
 * Socure DocAuth client
 * Migrated from Rails app/services/doc_auth/socure/
 * 
 * Handles:
 * - Document capture session creation (DocumentRequest)
 * - Document verification result fetching (DocvResultRequest)
 * - Image retrieval (ImagesRequest)
 */

import type {
  SocureConfig,
  SocureDocumentRequestParams,
  SocureDocumentRequestResponse,
  SocureDocvResultRequestParams,
  SocureImagesRequestParams,
  SocureImages,
  SocureIdPlusResponse,
} from './types';
import { SocureDocvResultResponse } from './response';
import {
  getConfigFromEnv,
  validateConfig,
  DEFAULT_TIMEOUT,
  MAX_RETRIES,
  RETRY_INTERVAL,
  RETRY_BACKOFF,
  RETRY_STATUSES,
} from './config';

export class SocureApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public referenceId?: string,
    public vendorStatus?: string,
    public vendorStatusMessage?: string
  ) {
    super(message);
    this.name = 'SocureApiError';
  }
}

export interface SocureClientDeps {
  config?: Partial<SocureConfig>;
  fetch?: typeof globalThis.fetch;
}

export class SocureClient {
  private config: SocureConfig;
  private fetch: typeof globalThis.fetch;

  constructor(deps: SocureClientDeps = {}) {
    this.config = {
      ...getConfigFromEnv(),
      ...deps.config,
    };
    this.fetch = deps.fetch || globalThis.fetch;
  }

  /**
   * Create a document capture session with Socure
   * @see Rails DocAuth::Socure::Requests::DocumentRequest
   */
  async createDocumentSession(
    params: SocureDocumentRequestParams
  ): Promise<SocureDocumentRequestResponse> {
    const body = this.buildDocumentRequestBody(params);

    const response = await this.sendRequest({
      url: this.config.documentRequestEndpoint,
      method: 'POST',
      body,
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new SocureApiError(
        `Document request failed: ${response.status}`,
        response.status,
        errorData.referenceId,
        errorData.status,
        errorData.msg
      );
    }

    const data = await response.json();
    return {
      url: data.url,
      docvTransactionToken: data.docvTransactionToken,
      referenceId: data.referenceId,
    };
  }

  /**
   * Fetch document verification results from Socure ID+
   * @see Rails DocAuth::Socure::Requests::DocvResultRequest
   */
  async fetchDocvResult(
    params: SocureDocvResultRequestParams
  ): Promise<SocureDocvResultResponse> {
    const endpoint = new URL(
      '/api/3.0/EmailAuthScore',
      this.config.idplusBaseUrl
    ).toString();

    const body = {
      modules: ['documentverification'],
      docvTransactionToken: params.docvTransactionToken,
      customerUserId: params.customerUserId,
      email: params.userEmail,
    };

    try {
      const response = await this.sendRequest({
        url: endpoint,
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new SocureApiError(
          `DocV result request failed: ${response.status}`,
          response.status,
          errorData.referenceId,
          errorData.status,
          errorData.msg
        );
      }

      const data: SocureIdPlusResponse = await response.json();

      return new SocureDocvResultResponse({
        response: data,
        passportRequested: params.passportRequested,
        config: this.config,
      });
    } catch (error) {
      if (error instanceof SocureApiError) throw error;
      throw this.handleConnectionError(error);
    }
  }

  /**
   * Download captured document images from Socure
   * @see Rails DocAuth::Socure::Requests::ImagesRequest
   */
  async fetchImages(params: SocureImagesRequestParams): Promise<SocureImages> {
    const endpoint = new URL(
      params.referenceId,
      this.config.imagesRequestEndpoint
    ).toString();

    const response = await this.sendRequest({
      url: endpoint,
      method: 'GET',
      contentType: 'application/zip',
    });

    if (!response.ok) {
      throw new SocureApiError(
        `Images request failed: ${response.status}`,
        response.status
      );
    }

    const zipBuffer = await response.arrayBuffer();
    return this.extractImagesFromZip(
      Buffer.from(zipBuffer),
      params.passportBook
    );
  }

  /**
   * Validate a Socure webhook payload
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    if (!this.config.webhookSecretKey) {
      throw new Error('Webhook secret key not configured');
    }

    const { createHmac } = require('crypto');
    const expectedSignature = createHmac(
      'sha256',
      this.config.webhookSecretKey
    )
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return signature === expectedSignature;
  }

  private buildDocumentRequestBody(params: SocureDocumentRequestParams): object {
    const redirect =
      process.env.NODE_ENV === 'development'
        ? null
        : {
            method: 'GET',
            url: params.redirectUrl,
          };

    const documentType = params.passportRequested ? 'passport' : 'license';
    const useCaseKey = params.livenessCheckingRequired
      ? this.config.flowIdWithSelfie
      : this.config.flowIdOnly;

    return {
      config: {
        documentType,
        redirect,
        language: this.normalizeLanguage(params.language),
        useCaseKey,
      },
      customerUserId: params.customerUserId,
    };
  }

  private normalizeLanguage(language: string): string {
    // Handle Chinese language code mapping
    if (language === 'zh') return 'zh-cn';
    return language;
  }

  private async sendRequest(options: {
    url: string;
    method: 'GET' | 'POST';
    body?: object;
    contentType?: string;
  }): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': options.contentType || 'application/json',
      Authorization: `SocureApiKey ${this.config.apiKey}`,
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || DEFAULT_TIMEOUT),
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    return this.fetchWithRetry(options.url, fetchOptions);
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 0
  ): Promise<Response> {
    try {
      const response = await this.fetch(url, options);

      if (
        RETRY_STATUSES.includes(response.status) &&
        attempt < MAX_RETRIES
      ) {
        const delay =
          RETRY_INTERVAL * Math.pow(RETRY_BACKOFF, attempt) +
          Math.random() * RETRY_INTERVAL * 0.5;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay =
          RETRY_INTERVAL * Math.pow(RETRY_BACKOFF, attempt) +
          Math.random() * RETRY_INTERVAL * 0.5;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private async parseErrorResponse(
    response: Response
  ): Promise<{ referenceId?: string; status?: string; msg?: string }> {
    try {
      const data = await response.json();
      return {
        referenceId: data.referenceId,
        status: data.status,
        msg: data.msg,
      };
    } catch {
      return {};
    }
  }

  private handleConnectionError(error: unknown): SocureApiError {
    if (error instanceof Error) {
      if (
        error.name === 'AbortError' ||
        error.message.includes('timeout')
      ) {
        return new SocureApiError('Request timeout');
      }
      return new SocureApiError(`Connection error: ${error.message}`);
    }
    return new SocureApiError('Unknown connection error');
  }

  private async extractImagesFromZip(
    zipBuffer: Buffer,
    passportBook?: boolean
  ): Promise<SocureImages> {
    // Note: In production, you'd use a library like adm-zip or jszip
    // For now, this is a simplified implementation that would need
    // an actual ZIP library
    const images: SocureImages = {};

    // The actual implementation would:
    // 1. Parse the ZIP file
    // 2. Extract entries with specific names:
    //    - 'documentbackDoc_Back_1_blob.jpg' -> back
    //    - 'documentfrontDoc_Front_1_blob.jpg' -> front (or passport if passportBook)
    //    - 'Doc_Selfie_1_blob.jpg' -> selfie
    // 3. Validate file sizes (max 5MB per image)
    // 4. Return the extracted images

    // Placeholder for now - would need adm-zip or similar
    console.warn(
      'ZIP extraction not fully implemented - requires ZIP library'
    );

    return images;
  }
}

// Factory function for dependency injection
export function createSocureClient(deps?: SocureClientDeps): SocureClient {
  return new SocureClient(deps);
}
