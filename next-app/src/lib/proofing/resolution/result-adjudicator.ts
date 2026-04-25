/**
 * Result Adjudicator - Determines final proofing outcome
 * Mirrors: app/services/proofing/resolution/result_adjudicator.rb
 */

import type { ApplicantPii } from '../types';
import type { ResolutionResult } from './result';
import type { StateIdResult } from '../aamva/state-id-result';
import type { DdpResult } from '../threatmetrix/ddp-result';
import { sameAddressAsId } from './plugins/types';

export interface PhoneResult {
  success: boolean;
  errors?: Record<string, string[]>;
  exception?: Error | null;
  transactionId?: string;
  vendorName?: string;
}

export interface ResultAdjudicatorParams {
  resolutionResult: ResolutionResult;
  stateIdResult: StateIdResult;
  residentialResolutionResult: ResolutionResult;
  phoneResult: PhoneResult;
  shouldProofStateId: boolean;
  ippEnrollmentInProgress: boolean;
  deviceProfilingResult: DdpResult;
  sameAddressAsId: string;
  applicantPii: ApplicantPii;
  precheckPhoneNumber: string | null;
  hybridMobileDeviceProfilingResult?: DdpResult | null;
}

export interface AdjudicatedResult {
  success: boolean;
  errors: Record<string, string[]>;
  extra: {
    exception: Error | null;
    timedOut: boolean;
    threatmetrixReviewStatus: string | null;
    hybridMobileThreatmetrixReviewStatus?: string | null;
    phonePrecheckPassed: boolean;
    context: {
      deviceProfilingAdjudicationReason: string;
      hybridMobileDeviceProfilingAdjudicationReason?: string;
      resolutionAdjudicationReason: string;
      shouldProofStateId: boolean;
      stages: {
        resolution: Record<string, unknown>;
        residentialAddress: Record<string, unknown>;
        stateId: Record<string, unknown>;
        threatmetrix: Record<string, unknown>;
        hybridMobileThreatmetrix?: Record<string, unknown>;
        phonePrecheck: PhoneResult;
      };
    };
    biographicalInfo: Record<string, unknown>;
  };
}

/**
 * Result Adjudicator - Combines all proofing results into final decision
 */
export class ResultAdjudicator {
  private params: ResultAdjudicatorParams;

  constructor(params: ResultAdjudicatorParams) {
    this.params = params;
  }

  /**
   * Get the adjudicated result
   */
  adjudicatedResult(): AdjudicatedResult {
    const [resolutionSuccess, resolutionReason] = this.resolutionResultAndReason();
    const [deviceProfilingSuccess, deviceProfilingReason] = this.deviceProfilingResultAndReason();
    const [hybridMobileSuccess, hybridMobileReason] = this.hybridMobileDeviceProfilingResultAndReason();

    return {
      success: resolutionSuccess && deviceProfilingSuccess && hybridMobileSuccess,
      errors: this.errors(),
      extra: {
        exception: this.exception(),
        timedOut: this.timedOut(),
        threatmetrixReviewStatus: this.params.deviceProfilingResult.reviewStatus,
        hybridMobileThreatmetrixReviewStatus: this.params.hybridMobileDeviceProfilingResult?.reviewStatus,
        phonePrecheckPassed: !!this.params.phoneResult.success,
        context: {
          deviceProfilingAdjudicationReason: deviceProfilingReason,
          hybridMobileDeviceProfilingAdjudicationReason: hybridMobileReason,
          resolutionAdjudicationReason: resolutionReason,
          shouldProofStateId: this.params.shouldProofStateId,
          stages: {
            resolution: this.params.resolutionResult.toHash(),
            residentialAddress: this.params.residentialResolutionResult.toHash(),
            stateId: this.params.stateIdResult.toHash(),
            threatmetrix: this.threatmetrixStage(),
            hybridMobileThreatmetrix: this.hybridMobileThreatmetrixStage(),
            phonePrecheck: this.params.phoneResult,
          },
        },
        biographicalInfo: this.biographicalInfo(),
      },
    };
  }

  /**
   * Check if state ID should be proofed
   */
  shouldProofStateId(): boolean {
    return this.params.shouldProofStateId;
  }

  /**
   * Combine errors from all results
   */
  private errors(): Record<string, string[]> {
    return {
      ...this.params.resolutionResult.errors,
      ...this.params.residentialResolutionResult.errors,
      ...this.params.stateIdResult.errors,
      ...(this.params.deviceProfilingResult.errors || {}),
      ...(this.params.hybridMobileDeviceProfilingResult?.errors || {}),
    };
  }

  /**
   * Get first exception from any result
   */
  private exception(): Error | null {
    return (
      this.params.resolutionResult.exception ||
      this.params.residentialResolutionResult.exception ||
      this.params.stateIdResult.exception ||
      this.params.deviceProfilingResult.exception ||
      this.params.hybridMobileDeviceProfilingResult?.exception ||
      null
    );
  }

  /**
   * Check if any result timed out
   */
  private timedOut(): boolean {
    return (
      this.params.resolutionResult.timedOut ||
      this.params.residentialResolutionResult.timedOut ||
      this.params.stateIdResult.timedOut ||
      this.params.deviceProfilingResult.timedOut ||
      !!this.params.hybridMobileDeviceProfilingResult?.timedOut
    );
  }

  /**
   * Build threatmetrix stage data
   */
  private threatmetrixStage(): Record<string, unknown> {
    return {
      ...this.params.deviceProfilingResult.toHash(),
      deviceFingerprint: this.params.deviceProfilingResult.deviceFingerprint,
    };
  }

  /**
   * Build hybrid mobile threatmetrix stage data
   */
  private hybridMobileThreatmetrixStage(): Record<string, unknown> | undefined {
    if (!this.params.hybridMobileDeviceProfilingResult) {
      return undefined;
    }

    return {
      ...this.params.hybridMobileDeviceProfilingResult.toHash(),
      deviceFingerprint: this.params.hybridMobileDeviceProfilingResult.deviceFingerprint,
    };
  }

  /**
   * Determine device profiling result and reason
   */
  private deviceProfilingResultAndReason(): [boolean, string] {
    if (this.params.deviceProfilingResult.hasException()) {
      return [false, 'device_profiling_exception'];
    }

    if (this.params.deviceProfilingResult.isSuccess()) {
      return [true, 'device_profiling_result_pass'];
    }

    // Non-passing review status is handled downstream, so considered success
    return [true, 'device_profiling_result_review_required'];
  }

  /**
   * Determine hybrid mobile device profiling result and reason
   */
  private hybridMobileDeviceProfilingResultAndReason(): [boolean, string] {
    const result = this.params.hybridMobileDeviceProfilingResult;

    if (!result) {
      return [true, 'hybrid_mobile_device_check_skipped'];
    }

    if (result.hasException()) {
      return [false, 'hybrid_mobile_device_profiling_exception'];
    }

    if (result.isSuccess()) {
      return [true, 'hybrid_mobile_device_profiling_result_pass'];
    }

    // Non-passing review status is handled downstream
    return [true, 'hybrid_mobile_device_profiling_result_review_required'];
  }

  /**
   * Determine resolution result and reason
   */
  private resolutionResultAndReason(): [boolean, string] {
    const {
      ippEnrollmentInProgress,
      residentialResolutionResult,
      resolutionResult,
      stateIdResult,
      applicantPii,
    } = this.params;

    // IPP with failed residential and different address
    if (
      ippEnrollmentInProgress &&
      !residentialResolutionResult.isSuccess() &&
      applicantPii.same_address_as_id === 'false'
    ) {
      return [false, 'fail_resolution_skip_state_id'];
    }

    // Both resolution and state ID passed
    if (resolutionResult.isSuccess() && stateIdResult.isSuccess()) {
      return [true, 'pass_resolution_and_state_id'];
    }

    // State ID failed
    if (!stateIdResult.isSuccess()) {
      return [false, 'fail_state_id'];
    }

    // Should not proof state ID
    if (!this.params.shouldProofStateId) {
      return [false, 'fail_resolution_skip_state_id'];
    }

    // Check if state ID attributes cover resolution failures
    if (this.stateIdAttributesCoverResolutionFailures()) {
      return [true, 'state_id_covers_failed_resolution'];
    }

    return [false, 'fail_resolution_without_state_id_coverage'];
  }

  /**
   * Check if state ID verified attributes cover failed resolution attributes
   */
  private stateIdAttributesCoverResolutionFailures(): boolean {
    const { resolutionResult, stateIdResult, applicantPii } = this.params;

    if (!resolutionResult.canPassWithAdditionalVerification()) {
      return false;
    }

    const failedAttributes = resolutionResult.attributesRequiringAdditionalVerification;
    let passedAttributes = stateIdResult.verifiedAttributes;

    // Also check pre-verified AAMVA attributes from doc auth
    if (applicantPii.aamva_verified_attributes) {
      passedAttributes = [...passedAttributes, ...applicantPii.aamva_verified_attributes];
    }

    // Check if all failed attributes are covered
    const uncoveredAttributes = failedAttributes.filter(
      (attr) => !passedAttributes.includes(attr)
    );

    return uncoveredAttributes.length === 0;
  }

  /**
   * Build biographical info for logging
   */
  private biographicalInfo(): Record<string, unknown> {
    const { applicantPii, precheckPhoneNumber, stateIdResult } = this.params;

    const stateIdNumber = applicantPii.state_id_number;
    const redactedStateIdNumber = stateIdNumber
      ? this.redactAlphanumeric(stateIdNumber)
      : undefined;

    const result: Record<string, unknown> = {
      birthYear: applicantPii.dob ? new Date(applicantPii.dob).getFullYear() : undefined,
      state: applicantPii.state,
      identityDocAddressState: applicantPii.identity_doc_address_state,
      stateIdJurisdiction: applicantPii.state_id_jurisdiction,
      stateIdNumber: redactedStateIdNumber,
      sameAddressAsId: applicantPii.same_address_as_id,
    };

    // Add phone precheck info
    if (precheckPhoneNumber) {
      // Basic phone info (would need proper phone parsing library for full implementation)
      result.phone = {
        areaCode: precheckPhoneNumber.slice(0, 3),
        countryCode: 'US',
      };
    }

    // Add state ID verified attributes if present
    if (applicantPii.aamva_verified_attributes) {
      result.stateIdVerifiedAttributes = applicantPii.aamva_verified_attributes;
    }

    return result;
  }

  /**
   * Redact alphanumeric string (keep first and last char, replace middle with *)
   */
  private redactAlphanumeric(str: string): string {
    if (str.length <= 2) return '*'.repeat(str.length);
    return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
  }
}

export function createResultAdjudicator(params: ResultAdjudicatorParams): ResultAdjudicator {
  return new ResultAdjudicator(params);
}
