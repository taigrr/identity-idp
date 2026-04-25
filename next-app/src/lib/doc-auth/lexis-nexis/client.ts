/**
 * LexisNexis TrueID client - mirrors Ruby's DocAuth::LexisNexis::LexisNexisClient
 * @see app/services/doc_auth/lexis_nexis/lexis_nexis_client.rb
 *
 * This is a simplified implementation - the real LexisNexis API is complex.
 * Full implementation would require their SDK or detailed API documentation.
 */

import { createHmac } from 'crypto';
import { DocAuthResponse } from '../response';
import type { DocAuthClient, PostImagesRequest, DocAuthResult, PiiFromDoc } from '../types';
import { DocAuthErrors } from '../errors';
import { LexisNexisConfig, validateConfig, getConfigFromEnv } from './config';

export interface TrueIdRequestParams extends PostImagesRequest {
  config: LexisNexisConfig;
}

export class LexisNexisClient implements DocAuthClient {
  private config: LexisNexisConfig;

  constructor(config?: Partial<LexisNexisConfig>) {
    this.config = {
      ...getConfigFromEnv(),
      ...config,
    };
    validateConfig(this.config);
  }

  async postImages(request: PostImagesRequest): Promise<DocAuthResult> {
    const workflow = this.selectWorkflow(
      request.livenessCheckingRequired ?? false,
      request.imagesCropped ?? false
    );

    try {
      const response = await this.sendTrueIdRequest({
        ...request,
        config: this.config,
        workflow,
      });

      return this.parseResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private selectWorkflow(livenessRequired: boolean, imagesCropped: boolean): string | undefined {
    if (livenessRequired && imagesCropped) {
      return this.config.trueidLivenessCroppingWorkflow;
    } else if (livenessRequired && !imagesCropped) {
      return this.config.trueidLivenessNoCroppingWorkflow;
    } else if (!livenessRequired && imagesCropped) {
      return this.config.trueidNoLivenessCroppingWorkflow;
    } else {
      return this.config.trueidNoLivenessNoCroppingWorkflow;
    }
  }

  private async sendTrueIdRequest(
    params: TrueIdRequestParams & { workflow?: string }
  ): Promise<TrueIdApiResponse> {
    const url = `${this.config.baseUrl}/restws/identity/v3/accounts/${this.config.trueidAccountId}/workflows/${params.workflow}/conversations`;

    const body = this.buildRequestBody(params);
    const headers = this.buildHeaders(body);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 60000),
    });

    if (!response.ok) {
      throw new LexisNexisApiError(`HTTP ${response.status}`, response.status);
    }

    return response.json() as Promise<TrueIdApiResponse>;
  }

  private buildRequestBody(params: TrueIdRequestParams): TrueIdRequestBody {
    const body: TrueIdRequestBody = {
      Settings: {
        Type: 'Initiate',
        Mode: this.config.requestMode || 'Testing',
        Locale: this.config.locale,
        Venue: 'online',
        Reference: params.userUuid ? `${params.uuidPrefix || ''}${params.userUuid}` : undefined,
      },
      Images: [],
    };

    if (params.frontImage) {
      body.Images.push({
        Content: this.encodeImage(params.frontImage),
        Context: 'Front',
      });
    }

    if (params.backImage) {
      body.Images.push({
        Content: this.encodeImage(params.backImage),
        Context: 'Back',
      });
    }

    if (params.passportImage) {
      body.Images.push({
        Content: this.encodeImage(params.passportImage),
        Context: 'Passport',
      });
    }

    if (params.selfieImage) {
      body.Images.push({
        Content: this.encodeImage(params.selfieImage),
        Context: 'Selfie',
      });
    }

    return body;
  }

  private encodeImage(image: Buffer | string): string {
    if (typeof image === 'string') {
      if (image.startsWith('data:')) {
        return image.split(',')[1];
      }
      return image;
    }
    return image.toString('base64');
  }

  private buildHeaders(body: TrueIdRequestBody): Record<string, string> {
    const timestamp = new Date().toISOString();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-]date': timestamp,
    };

    if (this.config.hmacKeyId && this.config.hmacSecretKey) {
      const stringToSign = JSON.stringify(body);
      const signature = createHmac('sha256', this.config.hmacSecretKey)
        .update(stringToSign)
        .digest('base64');
      headers['Authorization'] = `HMAC ${this.config.hmacKeyId}:${signature}`;
    } else if (this.config.trueidUsername && this.config.trueidPassword) {
      const auth = Buffer.from(
        `${this.config.trueidUsername}:${this.config.trueidPassword}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  private parseResponse(response: TrueIdApiResponse): DocAuthResult {
    const products = response.Products || [];
    const trueIdProduct = products.find((p) => p.ProductType === 'TrueID');

    if (!trueIdProduct) {
      return new DocAuthResponse({
        success: false,
        errors: { [DocAuthErrors.GENERAL_ERROR]: ['No TrueID product in response'] },
      }).toJSON();
    }

    const status = trueIdProduct.ProductStatus;
    const success = status === 'pass';

    const piiFromDoc = this.extractPii(trueIdProduct);
    const errors = this.extractErrors(trueIdProduct);

    return new DocAuthResponse({
      success,
      errors,
      piiFromDoc,
      extra: {
        conversationId: response.ConversationId,
        transactionId: trueIdProduct.ExecutedOrder?.[0]?.TransactionId,
        documentType: trueIdProduct.ParameterDetails?.DocumentClassName,
        vendor: 'lexisnexis',
      },
      attentionWithBarcode: this.hasAttentionWithBarcode(trueIdProduct),
      docTypeSupported: !errors[DocAuthErrors.DOC_TYPE_CHECK],
      selfieStatus: this.getSelfieStatus(trueIdProduct),
      selfieLive: this.getSelfieLiveness(trueIdProduct),
      selfieQualityGood: this.getSelfieQuality(trueIdProduct),
    }).toJSON();
  }

  private extractPii(product: TrueIdProduct): PiiFromDoc | undefined {
    const details = product.ParameterDetails;
    if (!details) return undefined;

    return {
      firstName: details.FirstName?.value,
      middleName: details.MiddleName?.value,
      lastName: details.LastName?.value,
      nameSuffix: details.NameSuffix?.value,
      address1: details.AddressLine1?.value,
      address2: details.AddressLine2?.value,
      city: details.City?.value,
      state: details.State?.value,
      stateIdJurisdiction: details.IssuingStateCode?.value,
      stateIdNumber: details.DocumentNumber?.value,
      stateIdType: details.DocumentClassName,
      stateIdIssued: details.IssueDate?.value,
      stateIdExpiration: details.ExpirationDate?.value,
      zipCode: details.PostalCode?.value,
      dob: details.DateOfBirth?.value,
      sex: details.Sex?.value,
      height: details.Height?.value,
      weight: details.Weight?.value,
      eyeColor: details.EyeColor?.value,
    };
  }

  private extractErrors(product: TrueIdProduct): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (product.ProductStatus === 'fail') {
      const alerts = product.ProcessedAlerts || [];
      for (const alert of alerts) {
        if (alert.Result === 'Failed' || alert.Result === 'Attention') {
          const errorKey = this.mapAlertToError(alert.AlertName);
          if (errorKey) {
            errors[errorKey] = errors[errorKey] || [];
            errors[errorKey].push(alert.AlertName);
          }
        }
      }

      if (Object.keys(errors).length === 0) {
        errors[DocAuthErrors.GENERAL_ERROR] = ['Document verification failed'];
      }
    }

    return errors;
  }

  private mapAlertToError(alertName: string): string | null {
    const alertMap: Record<string, string> = {
      '2D Barcode Content': DocAuthErrors.BARCODE_CONTENT_CHECK,
      '2D Barcode Read': DocAuthErrors.BARCODE_READ_CHECK,
      'Birth Date Crosscheck': DocAuthErrors.BIRTH_DATE_CHECKS,
      'Birth Date Valid': DocAuthErrors.BIRTH_DATE_CHECKS,
      'Control Number Check': DocAuthErrors.CONTROL_NUMBER_CHECK,
      'Document Classification': DocAuthErrors.ID_NOT_RECOGNIZED,
      'Document Crosscheck Aggregation': DocAuthErrors.DOC_CROSSCHECK,
      'Document Expired': DocAuthErrors.DOCUMENT_EXPIRED_CHECK,
      'Document Number Check': DocAuthErrors.DOC_NUMBER_CHECKS,
      'Expiration Date Crosscheck': DocAuthErrors.EXPIRATION_CHECKS,
      'Expiration Date Valid': DocAuthErrors.EXPIRATION_CHECKS,
      'Full Name Crosscheck': DocAuthErrors.FULL_NAME_CHECK,
      'Issue Date Crosscheck': DocAuthErrors.ISSUE_DATE_CHECKS,
      'Issue Date Valid': DocAuthErrors.ISSUE_DATE_CHECKS,
      'Photo Pattern Analysis': DocAuthErrors.VISIBLE_PHOTO_CHECK,
      'Sex Crosscheck': DocAuthErrors.SEX_CHECK,
      'Visible Color Response': DocAuthErrors.VISIBLE_COLOR_CHECK,
      'Visible Photo Characteristics': DocAuthErrors.VISIBLE_PHOTO_CHECK,
      'Document Support': DocAuthErrors.DOC_TYPE_CHECK,
    };

    return alertMap[alertName] || DocAuthErrors.GENERAL_ERROR;
  }

  private hasAttentionWithBarcode(product: TrueIdProduct): boolean {
    const alerts = product.ProcessedAlerts || [];
    return alerts.some(
      (alert) =>
        alert.AlertName.includes('Barcode') && alert.Result === 'Attention'
    );
  }

  private getSelfieStatus(product: TrueIdProduct): 'passed' | 'failed' | 'not_processed' {
    const selfieResult = product.ParameterDetails?.SelfieLivenessResult?.value;
    if (!selfieResult) return 'not_processed';
    return selfieResult === 'Pass' ? 'passed' : 'failed';
  }

  private getSelfieLiveness(product: TrueIdProduct): boolean {
    const result = product.ParameterDetails?.SelfieLivenessResult?.value;
    return result === 'Pass';
  }

  private getSelfieQuality(product: TrueIdProduct): boolean {
    const result = product.ParameterDetails?.SelfieQualityResult?.value;
    return result === 'Pass' || result === undefined;
  }

  private handleError(error: unknown): DocAuthResult {
    if (error instanceof LexisNexisApiError) {
      if (error.statusCode === 438) {
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.IMAGE_LOAD_FAILURE]: ['Image could not be loaded'] },
        }).toJSON();
      }
      if (error.statusCode === 439) {
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.PIXEL_DEPTH_FAILURE]: ['Invalid pixel depth'] },
        }).toJSON();
      }
      if (error.statusCode === 440) {
        return new DocAuthResponse({
          success: false,
          errors: { [DocAuthErrors.IMAGE_SIZE_FAILURE]: ['Image size invalid'] },
        }).toJSON();
      }
    }

    return new DocAuthResponse({
      success: false,
      errors: { [DocAuthErrors.NETWORK]: ['Network error communicating with vendor'] },
      exception: error instanceof Error ? error : new Error(String(error)),
    }).toJSON();
  }
}

class LexisNexisApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'LexisNexisApiError';
  }
}

// Types for TrueID API

interface TrueIdRequestBody {
  Settings: {
    Type: string;
    Mode: string;
    Locale: string;
    Venue: string;
    Reference?: string;
  };
  Images: Array<{
    Content: string;
    Context: string;
  }>;
}

interface TrueIdApiResponse {
  ConversationId: string;
  Products: TrueIdProduct[];
}

interface TrueIdProduct {
  ProductType: string;
  ProductStatus: string;
  ExecutedOrder?: Array<{
    TransactionId: string;
  }>;
  ParameterDetails?: Record<string, { value: string }> & {
    DocumentClassName?: string;
    SelfieLivenessResult?: { value: string };
    SelfieQualityResult?: { value: string };
  };
  ProcessedAlerts?: Array<{
    AlertName: string;
    Result: string;
  }>;
}
