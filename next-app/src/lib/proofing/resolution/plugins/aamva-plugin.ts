/**
 * AAMVA Plugin - State ID verification via AAMVA
 * Mirrors: app/services/proofing/resolution/plugins/aamva_plugin.rb
 */

import type { ApplicantPii } from '../../types';
import { StateIdResult } from '../../aamva/state-id-result';
import { AamvaProofer, createAamvaProofer } from '../../aamva/proofer';
import { MockAamvaProofer } from '../../mock/client';
import { ResolutionResult } from '../result';
import type { ProofingTimer, CurrentSP } from './types';
import {
  getProofingConfig,
  VENDOR_NAMES,
  withStateIdAddress,
  sameAddressAsId,
  isPassportApplicant,
  AAMVA_COVERABLE_ATTRIBUTES,
} from './types';

export interface AamvaPluginParams {
  applicantPii: ApplicantPii;
  currentSp: CurrentSP;
  stateIdAddressResolutionResult: ResolutionResult;
  ippEnrollmentInProgress: boolean;
  timer: ProofingTimer;
  alreadyProofed?: boolean;
}

/**
 * AAMVA Plugin for state ID verification
 */
export class AamvaPlugin {
  private config = getProofingConfig();

  /**
   * Execute AAMVA state ID verification
   */
  async call(params: AamvaPluginParams): Promise<StateIdResult> {
    const {
      applicantPii,
      stateIdAddressResolutionResult,
      ippEnrollmentInProgress,
      timer,
      alreadyProofed = false,
    } = params;

    // Skip if passport or already proofed
    if (isPassportApplicant(applicantPii) || alreadyProofed) {
      return this.skippedResult();
    }

    // Check if jurisdiction is supported
    if (!this.aamvaSupportsStateIdJurisdiction(applicantPii)) {
      return this.unsupportedJurisdictionResult();
    }

    // Determine if we should proof state ID
    const shouldProof = this.shouldProofStateId({
      applicantPii,
      stateIdAddressResolutionResult,
      ippEnrollmentInProgress,
    });

    if (!shouldProof) {
      return this.skippedResult();
    }

    // Transform PII if in-person proofing
    const applicantPiiWithStateIdAddress = ippEnrollmentInProgress
      ? withStateIdAddress(applicantPii)
      : applicantPii;

    // Get proofer
    const proofer = this.getProofer();

    // Execute with timing
    const result = await timer.time('state_id', async () => {
      return proofer.proof(applicantPiiWithStateIdAddress);
    });

    // TODO: Add SP cost tracking if no exception
    // if (!result.exception) {
    //   Db::SpCost::AddSpCost.call(currentSp, :aamva, transaction_id: result.transactionId)
    // }

    return result;
  }

  /**
   * Check if AAMVA supports the state ID jurisdiction
   */
  aamvaSupportsStateIdJurisdiction(applicantPii: ApplicantPii): boolean {
    const jurisdiction = applicantPii.state_id_jurisdiction;
    if (!jurisdiction) return false;
    return this.config.aamvaSupportedJurisdictions.includes(jurisdiction);
  }

  /**
   * Determine if state ID should be proofed
   */
  private shouldProofStateId(params: {
    applicantPii: ApplicantPii;
    stateIdAddressResolutionResult: ResolutionResult;
    ippEnrollmentInProgress: boolean;
  }): boolean {
    const { applicantPii, stateIdAddressResolutionResult, ippEnrollmentInProgress } = params;

    // If IPP and different address, check resolution success
    if (ippEnrollmentInProgress && !sameAddressAsId(applicantPii)) {
      return stateIdAddressResolutionResult.isSuccess();
    }

    // Otherwise check if user can pass after state ID check (Get-to-Yes)
    return this.userCanPassAfterStateIdCheck(stateIdAddressResolutionResult);
  }

  /**
   * Check if user can pass with state ID verification covering failed resolution
   * (Get-to-Yes with AAMVA feature)
   */
  private userCanPassAfterStateIdCheck(stateIdAddressResolutionResult: ResolutionResult): boolean {
    if (stateIdAddressResolutionResult.isSuccess()) {
      return true;
    }

    // Check if failed result can pass with additional verification
    if (!stateIdAddressResolutionResult.canPassWithAdditionalVerification()) {
      return false;
    }

    // Check if all failed attributes can be covered by AAMVA
    const attributesRequiringVerification =
      stateIdAddressResolutionResult.attributesRequiringAdditionalVerification;

    const uncoverableAttributes = attributesRequiringVerification.filter(
      (attr) => !AAMVA_COVERABLE_ATTRIBUTES.includes(attr as any)
    );

    return uncoverableAttributes.length === 0;
  }

  /**
   * Get the appropriate proofer based on configuration
   */
  private getProofer(): AamvaProofer | MockAamvaProofer {
    if (this.config.prooferMockFallback) {
      return new MockAamvaProofer();
    }

    return createAamvaProofer();
  }

  /**
   * Result for unsupported jurisdiction
   */
  unsupportedJurisdictionResult(): StateIdResult {
    return new StateIdResult({
      success: true,
      errors: {},
      exception: null,
      vendorName: VENDOR_NAMES.AAMVA_UNSUPPORTED_JURISDICTION,
    });
  }

  /**
   * Result when AAMVA check is skipped
   */
  skippedResult(): StateIdResult {
    return new StateIdResult({
      success: true,
      errors: {},
      exception: null,
      vendorName: VENDOR_NAMES.AAMVA_CHECK_SKIPPED,
    });
  }
}

export function createAamvaPlugin(): AamvaPlugin {
  return new AamvaPlugin();
}
