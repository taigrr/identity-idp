/**
 * Residential Address Plugin - Verifies residential address for IPP
 * Mirrors: app/services/proofing/resolution/plugins/residential_address_plugin.rb
 */

import type { ApplicantPii } from '../../types';
import { ResolutionResult } from '../result';
import type { InstantVerifyProofer } from '../../lexis-nexis/instant-verify-proofer';
import type { MockResolutionProofer } from '../../mock/client';
import type { ProofingTimer, CurrentSP } from './types';
import { VENDOR_NAMES } from './types';

export interface ResidentialAddressPluginParams {
  applicantPii: ApplicantPii;
  currentSp: CurrentSP;
  ippEnrollmentInProgress: boolean;
  timer: ProofingTimer;
}

export interface ResidentialAddressPluginOptions {
  proofer: InstantVerifyProofer | MockResolutionProofer;
  spCostToken: string;
}

/**
 * Residential Address Plugin for in-person proofing
 */
export class ResidentialAddressPlugin {
  private proofer: InstantVerifyProofer | MockResolutionProofer;
  private spCostToken: string;

  constructor(options: ResidentialAddressPluginOptions) {
    this.proofer = options.proofer;
    this.spCostToken = options.spCostToken;
  }

  /**
   * Execute residential address verification
   */
  async call(params: ResidentialAddressPluginParams): Promise<ResolutionResult> {
    const { applicantPii, ippEnrollmentInProgress, timer } = params;

    // Residential address verification is only needed for IPP
    if (!ippEnrollmentInProgress) {
      return this.residentialAddressUnnecessaryResult();
    }

    // Execute with timing
    const result = await timer.time('residential address', async () => {
      // Convert ApplicantPii to InstantVerifyApplicant format
      const ivApplicant = {
        uuid: applicantPii.uuid || '',
        firstName: applicantPii.first_name,
        lastName: applicantPii.last_name,
        ssn: applicantPii.ssn || '',
        dob: applicantPii.dob,
        address1: applicantPii.address1,
        address2: applicantPii.address2,
        city: applicantPii.city,
        state: applicantPii.state,
        zipcode: applicantPii.zipcode,
      };

      return this.proofer.proof(ivApplicant as any);
    });

    // TODO: Add SP cost tracking
    // Db::SpCost::AddSpCost.call(currentSp, :lexis_nexis_resolution, transaction_id: result.transactionId)

    return result;
  }

  /**
   * Result when residential address verification is not needed
   */
  private residentialAddressUnnecessaryResult(): ResolutionResult {
    return new ResolutionResult({
      success: true,
      errors: {},
      exception: null,
      vendorName: VENDOR_NAMES.RESIDENTIAL_ADDRESS_NOT_REQUIRED,
    });
  }
}

export function createResidentialAddressPlugin(
  options: ResidentialAddressPluginOptions
): ResidentialAddressPlugin {
  return new ResidentialAddressPlugin(options);
}
