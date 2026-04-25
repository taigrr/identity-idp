/**
 * AAMVA Proofer - State ID verification via AAMVA DLDV 2.1 service
 * Mirrors: app/services/proofing/aamva/proofer.rb
 */

import type { ApplicantPii } from '../types';
import {
  AAMVA_REQUIRED_VERIFICATION_ATTRIBUTES,
  AAMVA_REQUIRED_IF_PRESENT_ATTRIBUTES,
  ADDRESS_ATTRIBUTES,
  REQUIRED_ADDRESS_ATTRIBUTES,
  ProofingTimeoutError,
} from '../types';
import type { AamvaConfig } from './config';
import {
  createAamvaConfig,
  AAMVA_CONSTANTS,
  DOCUMENT_CATEGORY_CODES,
  SEX_CODES,
  VERIFICATION_ATTRIBUTES_MAP,
  SPLIT_LAST_NAME_STATES,
} from './config';
import { StateIdResult } from './state-id-result';
import { createAamvaApplicant, type AamvaApplicant } from './applicant';

/**
 * Verification response from AAMVA
 */
export interface VerificationResponse {
  verificationResults: Record<string, boolean | null>;
  transactionLocatorId: string;
}

/**
 * Requested attributes status
 */
export type RequestedAttributeStatus = 'present' | 'missing';

/**
 * AAMVA maintenance window checker interface
 */
export interface MaintenanceWindowChecker {
  isInMaintenanceWindow(state: string): boolean;
}

/**
 * Default maintenance window checker (always returns false)
 */
const defaultMaintenanceChecker: MaintenanceWindowChecker = {
  isInMaintenanceWindow: () => false,
};

export interface AamvaProoferOptions {
  config?: AamvaConfig;
  maintenanceChecker?: MaintenanceWindowChecker;
}

/**
 * AAMVA Proofer class
 */
export class AamvaProofer {
  private config: AamvaConfig;
  private maintenanceChecker: MaintenanceWindowChecker;

  constructor(options: AamvaProoferOptions = {}) {
    this.config = options.config ?? createAamvaConfig();
    this.maintenanceChecker = options.maintenanceChecker ?? defaultMaintenanceChecker;
  }

  /**
   * Verify state ID information against AAMVA
   */
  async proof(applicantPii: ApplicantPii): Promise<StateIdResult> {
    const aamvaApplicant = createAamvaApplicant(applicantPii);
    const jurisdiction = applicantPii.state_id_jurisdiction;

    try {
      const response = await this.sendVerificationRequest(aamvaApplicant);
      return this.buildResult(response, aamvaApplicant, jurisdiction);
    } catch (error) {
      return this.buildErrorResult(error as Error, jurisdiction);
    }
  }

  /**
   * Send verification request to AAMVA
   */
  private async sendVerificationRequest(applicant: AamvaApplicant): Promise<VerificationResponse> {
    const requestBody = this.buildRequestBody(applicant);
    const headers = this.buildRequestHeaders(requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.verificationRequestTimeout * 1000
    );

    try {
      const response = await fetch(this.config.verificationUrl, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Unexpected status code in response: ${response.status}`);
      }

      const responseText = await response.text();
      return this.parseVerificationResponse(responseText);
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ProofingTimeoutError('AAMVA verification request timed out');
      }

      throw error;
    }
  }

  /**
   * Build SOAP request body for AAMVA verification
   */
  private buildRequestBody(applicant: AamvaApplicant): string {
    const messageDestinationId = this.getMessageDestinationId(applicant);
    const stateIdNumber = this.formatStateIdNumber(applicant);
    const lastName = this.formatLastName(applicant);

    // Build SOAP envelope
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:dldv="http://aamva.org/dldv/wsdl/2.1"
  xmlns:aa="http://aamva.org/dldv/2.1"
  xmlns:nc="http://niem.gov/niem/niem-core/2.0">
  <soap:Header/>
  <soap:Body>
    <dldv:verifyDriverLicenseDataRequest>
      <aa:TransactionType>DLDV</aa:TransactionType>
      <aa:TransactionLocatorId>${applicant.uuid || ''}</aa:TransactionLocatorId>
      <aa:MessageDestinationId>${messageDestinationId}</aa:MessageDestinationId>
      <nc:IdentificationID>${stateIdNumber}</nc:IdentificationID>
      <aa:PersonBirthDate>${applicant.dob}</aa:PersonBirthDate>
      <nc:PersonName>
        <nc:PersonGivenName>${this.escapeXml(applicant.firstName)}</nc:PersonGivenName>
        <nc:PersonSurName>${this.escapeXml(lastName)}</nc:PersonSurName>
        ${applicant.middleName ? `<nc:PersonMiddleName>${this.escapeXml(applicant.middleName)}</nc:PersonMiddleName>` : ''}
        ${applicant.nameSuffix ? `<nc:PersonNameSuffixText>${this.escapeXml(applicant.nameSuffix)}</nc:PersonNameSuffixText>` : ''}
      </nc:PersonName>
      <aa:Address>
        <nc:AddressDeliveryPointText>${this.escapeXml(applicant.address1)}</nc:AddressDeliveryPointText>
        ${applicant.address2 ? `<nc:AddressDeliveryPointText>${this.escapeXml(applicant.address2)}</nc:AddressDeliveryPointText>` : ''}
        <nc:LocationCityName>${this.escapeXml(applicant.city)}</nc:LocationCityName>
        <nc:LocationStateUsPostalServiceCode>${applicant.state}</nc:LocationStateUsPostalServiceCode>
        <nc:LocationPostalCode>${applicant.zipcode}</nc:LocationPostalCode>
      </aa:Address>
      ${this.buildOptionalElements(applicant)}
    </dldv:verifyDriverLicenseDataRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build optional SOAP elements for additional attributes
   */
  private buildOptionalElements(applicant: AamvaApplicant): string {
    const elements: string[] = [];

    if (applicant.stateIdData.stateIdExpiration) {
      elements.push(`<aa:DriverLicenseExpirationDate>${applicant.stateIdData.stateIdExpiration}</aa:DriverLicenseExpirationDate>`);
    }

    if (applicant.stateIdData.stateIdIssued) {
      elements.push(`<aa:DriverLicenseIssueDate>${applicant.stateIdData.stateIdIssued}</aa:DriverLicenseIssueDate>`);
    }

    if (applicant.stateIdData.documentTypeReceived) {
      const code = DOCUMENT_CATEGORY_CODES[applicant.stateIdData.documentTypeReceived];
      if (code) {
        elements.push(`<aa:DocumentCategoryCode>${code}</aa:DocumentCategoryCode>`);
      }
    }

    if (applicant.height) {
      elements.push(`<aa:PersonHeightMeasure>${applicant.height}</aa:PersonHeightMeasure>`);
    }

    if (applicant.weight) {
      elements.push(`<aa:PersonWeightMeasure>${applicant.weight}</aa:PersonWeightMeasure>`);
    }

    if (applicant.eyeColor) {
      elements.push(`<aa:PersonEyeColorCode>${applicant.eyeColor}</aa:PersonEyeColorCode>`);
    }

    if (applicant.sex) {
      const code = SEX_CODES[applicant.sex as keyof typeof SEX_CODES];
      if (code) {
        elements.push(`<aa:PersonSexCode>${code}</aa:PersonSexCode>`);
      }
    }

    return elements.join('\n      ');
  }

  /**
   * Build request headers
   */
  private buildRequestHeaders(body: string): Record<string, string> {
    return {
      'SOAPAction': AAMVA_CONSTANTS.SOAP_ACTION,
      'Content-Type': AAMVA_CONSTANTS.CONTENT_TYPE,
      'Content-Length': String(Buffer.byteLength(body, 'utf8')),
    };
  }

  /**
   * Get message destination ID (jurisdiction routing)
   */
  private getMessageDestinationId(applicant: AamvaApplicant): string {
    if (this.config.certEnabled) {
      return AAMVA_CONSTANTS.CERT_JURISDICTION;
    }
    return applicant.stateIdData.stateIdJurisdiction;
  }

  /**
   * Format state ID number with state-specific rules
   */
  private formatStateIdNumber(applicant: AamvaApplicant): string {
    const { stateIdNumber, stateIdJurisdiction } = applicant.stateIdData;

    // South Carolina requires 8-digit padding
    if (stateIdJurisdiction === 'SC') {
      return stateIdNumber.padStart(8, '0');
    }

    return stateIdNumber;
  }

  /**
   * Format last name with state-specific rules
   */
  private formatLastName(applicant: AamvaApplicant): string {
    const jurisdiction = applicant.stateIdData.stateIdJurisdiction;

    if (SPLIT_LAST_NAME_STATES.includes(jurisdiction)) {
      return applicant.lastName.split(' ')[0];
    }

    return applicant.lastName;
  }

  /**
   * Parse AAMVA verification response
   */
  private parseVerificationResponse(responseText: string): VerificationResponse {
    const verificationResults: Record<string, boolean | null> = {};

    // Parse match indicators from response
    for (const [indicator, attribute] of Object.entries(VERIFICATION_ATTRIBUTES_MAP)) {
      const match = responseText.match(new RegExp(`<${indicator}>([^<]*)</${indicator}>`));

      if (!match) {
        verificationResults[attribute] = null;
      } else if (match[1] === 'true') {
        verificationResults[attribute] = true;
      } else {
        verificationResults[attribute] = false;
      }
    }

    // Extract transaction locator ID
    const transactionMatch = responseText.match(/<TransactionLocatorI[dD]>([^<]*)<\/TransactionLocatorI[dD]>/);
    const transactionLocatorId = transactionMatch?.[1]?.trim() ?? '';

    return {
      verificationResults,
      transactionLocatorId,
    };
  }

  /**
   * Build successful result from verification response
   */
  private buildResult(
    response: VerificationResponse,
    applicant: AamvaApplicant,
    jurisdiction?: string
  ): StateIdResult {
    const success = this.isSuccessful(response);
    const errors = this.parseVerificationErrors(response);
    const verifiedAttributes = this.getVerifiedAttributes(response);
    const requestedAttributes = this.getRequestedAttributes(applicant);

    return new StateIdResult({
      success,
      errors,
      exception: null,
      vendorName: 'aamva:state_id',
      transactionId: response.transactionLocatorId,
      requestedAttributes,
      verifiedAttributes,
      jurisdictionInMaintenanceWindow: this.maintenanceChecker.isInMaintenanceWindow(
        jurisdiction ?? ''
      ),
    });
  }

  /**
   * Build error result from exception
   */
  private buildErrorResult(error: Error, jurisdiction?: string): StateIdResult {
    return new StateIdResult({
      success: false,
      errors: {},
      exception: error,
      vendorName: 'aamva:state_id',
      transactionId: '',
      verifiedAttributes: [],
      requestedAttributes: {},
      jurisdictionInMaintenanceWindow: this.maintenanceChecker.isInMaintenanceWindow(
        jurisdiction ?? ''
      ),
    });
  }

  /**
   * Check if verification was successful
   */
  private isSuccessful(response: VerificationResponse): boolean {
    // Check required attributes
    for (const attr of AAMVA_REQUIRED_VERIFICATION_ATTRIBUTES) {
      if (!response.verificationResults[attr]) {
        return false;
      }
    }

    // Check required-if-present attributes
    for (const attr of AAMVA_REQUIRED_IF_PRESENT_ATTRIBUTES) {
      const value = response.verificationResults[attr];
      if (value !== null && value !== true) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse verification errors from response
   */
  private parseVerificationErrors(
    response: VerificationResponse
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (this.isSuccessful(response)) {
      return errors;
    }

    for (const [attribute, result] of Object.entries(response.verificationResults)) {
      if (result === false) {
        errors[attribute] = ['UNVERIFIED'];
      } else if (result === null) {
        errors[attribute] = ['MISSING'];
      }
    }

    return errors;
  }

  /**
   * Get verified attributes from response
   */
  private getVerifiedAttributes(response: VerificationResponse): string[] {
    const attributes = Object.entries(response.verificationResults)
      .filter(([, verified]) => verified === true)
      .map(([attr]) => attr);

    return this.normalizeAddressAttributes(new Set(attributes));
  }

  /**
   * Get requested attributes from applicant
   */
  private getRequestedAttributes(applicant: AamvaApplicant): Record<string, number> {
    const result: Record<string, number> = {};

    // Mark present attributes
    if (applicant.firstName) result.first_name = 1;
    if (applicant.lastName) result.last_name = 1;
    if (applicant.dob) result.dob = 1;
    if (applicant.stateIdData.stateIdNumber) result.state_id_number = 1;
    if (applicant.address1) result.address1 = 1;
    if (applicant.city) result.city = 1;
    if (applicant.state) result.state = 1;
    if (applicant.zipcode) result.zipcode = 1;

    // Optional attributes
    if (applicant.middleName) result.middle_name = 1;
    if (applicant.nameSuffix) result.name_suffix = 1;
    if (applicant.address2) result.address2 = 1;
    if (applicant.stateIdData.stateIdExpiration) result.state_id_expiration = 1;

    return result;
  }

  /**
   * Normalize address attributes - combine into single 'address' if all required present
   */
  private normalizeAddressAttributes(attributeSet: Set<string>): string[] {
    const requiredAddressAttrs = [...REQUIRED_ADDRESS_ATTRIBUTES];
    const hasAllRequired = requiredAddressAttrs.every((attr) => attributeSet.has(attr));

    // Remove individual address attributes and add combined 'address' if all present
    const result = [...attributeSet].filter((attr) => !ADDRESS_ATTRIBUTES.has(attr));

    if (hasAllRequired) {
      result.push('address');
    }

    return result;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Factory function to create AAMVA proofer
 */
export function createAamvaProofer(options?: AamvaProoferOptions): AamvaProofer {
  return new AamvaProofer(options);
}
