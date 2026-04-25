/**
 * ThreatMetrix Proofer - Device profiling and fraud detection via LexisNexis DDP
 * Mirrors: app/services/proofing/lexis_nexis/ddp/proofers/threat_metrix_proofer.rb
 */

import type { DdpResponseBody } from '../types';
import { ProofingTimeoutError } from '../types';
import { DdpResult } from './ddp-result';
import type { ThreatMetrixConfig, ThreatMetrixApplicant } from './config';
import {
  createThreatMetrixConfig,
  THREATMETRIX_CONSTANTS,
  VALID_REVIEW_STATUSES,
} from './config';

export interface ThreatMetrixProoferOptions {
  config?: ThreatMetrixConfig;
}

/**
 * ThreatMetrix Proofer class
 */
export class ThreatMetrixProofer {
  private config: ThreatMetrixConfig;

  constructor(options: ThreatMetrixProoferOptions = {}) {
    this.config = options.config ?? createThreatMetrixConfig();
  }

  /**
   * Perform device profiling via ThreatMetrix
   */
  async proof(applicant: ThreatMetrixApplicant): Promise<DdpResult> {
    try {
      const response = await this.sendRequest(applicant);
      return this.buildResultFromResponse(response);
    } catch (error) {
      return this.buildResultFromException(error as Error);
    }
  }

  /**
   * Send ThreatMetrix request
   */
  private async sendRequest(applicant: ThreatMetrixApplicant): Promise<DdpResponseBody> {
    const url = `${this.config.baseUrl}${THREATMETRIX_CONSTANTS.SESSION_QUERY_PATH}`;
    const body = this.buildRequestBody(applicant);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout * 1000
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ThreatMetrix request failed with status: ${response.status}`);
      }

      return await response.json() as DdpResponseBody;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ProofingTimeoutError('ThreatMetrix request timed out');
      }

      throw error;
    }
  }

  /**
   * Build ThreatMetrix request body
   */
  private buildRequestBody(applicant: ThreatMetrixApplicant): Record<string, string> {
    // Format DOB to YYYYMMDD
    const dobFormatted = applicant.dob
      ? applicant.dob.replace(/-/g, '')
      : '';

    // Clean SSN (digits only)
    const ssnClean = applicant.ssn
      ? applicant.ssn.replace(/\D/g, '')
      : '';

    // Clean state ID number
    const stateIdClean = applicant.stateIdNumber
      ? applicant.stateIdNumber.replace(/\W/g, '')
      : '';

    return {
      api_key: this.config.apiKey,
      org_id: this.config.orgId,
      account_address_street1: applicant.address1 || '',
      account_address_street2: applicant.address2 || '',
      account_address_city: applicant.city || '',
      account_address_state: applicant.state || '',
      account_address_country: applicant.state ? 'US' : '',
      account_address_zip: applicant.zipcode || '',
      account_date_of_birth: dobFormatted,
      account_email: applicant.email,
      account_first_name: applicant.firstName || '',
      account_last_name: applicant.lastName || '',
      account_telephone: '', // Intentionally left empty per decision not to send phone
      account_drivers_license_number: stateIdClean,
      account_drivers_license_type: applicant.stateIdNumber
        ? THREATMETRIX_CONSTANTS.DRIVERS_LICENSE_TYPE
        : '',
      account_drivers_license_issuer: applicant.stateIdJurisdiction?.trim() || '',
      customer_event_type: applicant.workflow,
      event_type: THREATMETRIX_CONSTANTS.EVENT_TYPE,
      policy: this.config.ddpPolicy,
      service_type: THREATMETRIX_CONSTANTS.SERVICE_TYPE,
      session_id: applicant.threatmetrixSessionId,
      national_id_number: ssnClean,
      national_id_type: applicant.ssn
        ? THREATMETRIX_CONSTANTS.NATIONAL_ID_TYPE
        : '',
      input_ip_address: applicant.requestIp,
      local_attrib_1: applicant.uuidPrefix || '',
      local_attrib_3: applicant.uuid,
    };
  }

  /**
   * Build result from successful response
   */
  private buildResultFromResponse(body: DdpResponseBody): DdpResult {
    const result = new DdpResult();

    result.responseBody = body;
    result.transactionId = body.request_id || '';

    const requestResult = body.request_result as string | undefined;
    const reviewStatus = body.review_status as string | undefined;

    // Validate review status
    this.validateReviewStatus(reviewStatus);

    result.reviewStatus = reviewStatus as DdpResult['reviewStatus'];

    // Add errors for non-success results
    if (requestResult !== 'success') {
      result.addError(requestResult || 'unknown', 'request_result');
    }

    if (reviewStatus !== 'pass') {
      result.addError(reviewStatus || 'unknown', 'review_status');
    }

    result.accountLexId = body.account_lex_id as string | undefined;
    result.sessionId = body.session_id as string | undefined;

    result.success = !result.hasErrors();
    result.client = 'lexisnexis';

    return result;
  }

  /**
   * Build result from exception
   */
  private buildResultFromException(exception: Error): DdpResult {
    return DdpResult.fromException(exception);
  }

  /**
   * Validate that review status is one of the expected values
   */
  private validateReviewStatus(reviewStatus: string | undefined): void {
    if (!reviewStatus) {
      throw new Error('ThreatMetrix response missing review_status');
    }

    if (!VALID_REVIEW_STATUSES.includes(reviewStatus as typeof VALID_REVIEW_STATUSES[number])) {
      throw new Error(`Unexpected ThreatMetrix review_status value: ${reviewStatus}`);
    }
  }
}

/**
 * Factory function to create ThreatMetrix proofer
 */
export function createThreatMetrixProofer(options?: ThreatMetrixProoferOptions): ThreatMetrixProofer {
  return new ThreatMetrixProofer(options);
}
