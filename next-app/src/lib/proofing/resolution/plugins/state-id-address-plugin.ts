/**
 * State ID Address Plugin - Verifies state ID address via resolution
 * Mirrors: app/services/proofing/resolution/plugins/state_id_address_plugin.rb
 */

import type { ApplicantPii } from '../../types';
import { ResolutionResult } from '../result';
import type { InstantVerifyProofer } from '../../lexis-nexis/instant-verify-proofer';
import type { MockResolutionProofer } from '../../mock/client';
import type { ProofingTimer, CurrentSP } from './types';
import { withStateIdAddress, sameAddressAsId, VENDOR_NAMES } from './types';

export interface StateIdAddressPluginParams {
  applicantPii: ApplicantPii;
  currentSp: CurrentSP;
  residentialAddressResolutionResult: ResolutionResult;
  ippEnrollmentInProgress: boolean;
  timer: ProofingTimer;
}

export interface StateIdAddressPluginOptions {
  proofer: InstantVerifyProofer | MockResolutionProofer;
  spCostToken: string;
}

/**
 * State ID Address Plugin for identity resolution
 */
export class StateIdAddressPlugin {
  private proofer: InstantVerifyProofer | MockResolutionProofer;
  private spCostToken: string;

  constructor(options: StateIdAddressPluginOptions) {
    this.proofer = options.proofer;
    this.spCostToken = options.spCostToken;
  }

  /**
   * Execute state ID address verification
   */
  async call(params: StateIdAddressPluginParams): Promise<ResolutionResult> {
    const {
      applicantPii,
      residentialAddressResolutionResult,
      ippEnrollmentInProgress,
      timer,
    } = params;

    // If same address as ID during IPP, reuse residential result
    if (sameAddressAsId(applicantPii) && ippEnrollmentInProgress) {
      return residentialAddressResolutionResult;
    }

    // If residential resolution failed, cannot proceed
    if (!residentialAddressResolutionResult.isSuccess()) {
      return this.resolutionCannotPassResult();
    }

    // Transform PII to use state ID address if IPP
    const applicantPiiWithStateIdAddress = ippEnrollmentInProgress
      ? withStateIdAddress(applicantPii)
      : applicantPii;

    // Execute with timing
    const result = await timer.time('resolution', async () => {
      // Convert to InstantVerify applicant format
      const ivApplicant = {
        uuid: applicantPiiWithStateIdAddress.uuid || '',
        firstName: applicantPiiWithStateIdAddress.first_name,
        lastName: applicantPiiWithStateIdAddress.last_name,
        ssn: applicantPiiWithStateIdAddress.ssn || '',
        dob: applicantPiiWithStateIdAddress.dob,
        address1: applicantPiiWithStateIdAddress.address1,
        address2: applicantPiiWithStateIdAddress.address2,
        city: applicantPiiWithStateIdAddress.city,
        state: applicantPiiWithStateIdAddress.state,
        zipcode: applicantPiiWithStateIdAddress.zipcode,
      };

      return this.proofer.proof(ivApplicant as any);
    });

    // TODO: Add SP cost tracking
    // Db::SpCost::AddSpCost.call(currentSp, :lexis_nexis_resolution, transaction_id: result.transactionId)

    return result;
  }

  /**
   * Result when resolution cannot pass due to failed residential check
   */
  private resolutionCannotPassResult(): ResolutionResult {
    return new ResolutionResult({
      success: false,
      errors: {},
      exception: null,
      vendorName: VENDOR_NAMES.RESOLUTION_CANNOT_PASS,
    });
  }
}

export function createStateIdAddressPlugin(
  options: StateIdAddressPluginOptions
): StateIdAddressPlugin {
  return new StateIdAddressPlugin(options);
}
