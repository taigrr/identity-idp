/**
 * ThreatMetrix Plugin - Device profiling and fraud detection
 * Mirrors: app/services/proofing/resolution/plugins/threat_metrix_plugin.rb
 */

import type { ApplicantPii } from '../../types';
import { DdpResult } from '../../threatmetrix/ddp-result';
import { ThreatMetrixProofer, createThreatMetrixProofer } from '../../threatmetrix/proofer';
import type { ThreatMetrixApplicant } from '../../threatmetrix/config';
import { MockThreatMetrixProofer } from '../../mock/client';
import type { ProofingTimer, CurrentSP } from './types';
import { getProofingConfig, VENDOR_NAMES } from './types';

export interface ThreatMetrixPluginParams {
  applicantPii: ApplicantPii;
  currentSp: CurrentSP;
  requestIp: string;
  threatmetrixSessionId: string;
  timer: ProofingTimer;
  userEmail: string;
  userUuid: string;
  workflow: string;
  ddpPolicy: string;
}

/**
 * ThreatMetrix Plugin for device profiling
 */
export class ThreatMetrixPlugin {
  private config = getProofingConfig();

  /**
   * Execute ThreatMetrix device profiling
   */
  async call(params: ThreatMetrixPluginParams): Promise<DdpResult> {
    const {
      applicantPii,
      requestIp,
      threatmetrixSessionId,
      timer,
      userEmail,
      userUuid,
      workflow,
      ddpPolicy,
    } = params;

    // Check if device profiling is enabled
    if (!this.config.proofingDeviceProfilingEnabled) {
      return this.threatmetrixDisabledResult();
    }

    // Validate required inputs
    if (!threatmetrixSessionId) {
      return this.threatmetrixIdMissingResult();
    }

    if (!applicantPii || Object.keys(applicantPii).length === 0) {
      return this.threatmetrixPiiMissingResult();
    }

    // Build ThreatMetrix applicant data
    const tmxApplicant: ThreatMetrixApplicant = {
      uuid: userUuid,
      uuidPrefix: undefined,
      threatmetrixSessionId,
      requestIp,
      workflow,
      firstName: applicantPii.first_name,
      lastName: applicantPii.last_name,
      email: userEmail,
      dob: applicantPii.dob,
      ssn: applicantPii.ssn,
      address1: applicantPii.address1,
      address2: applicantPii.address2,
      city: applicantPii.city,
      state: applicantPii.state,
      zipcode: applicantPii.zipcode,
      stateIdNumber: applicantPii.state_id_number,
      stateIdJurisdiction: applicantPii.state_id_jurisdiction,
    };

    // Get proofer (mock or real)
    const proofer = this.getProofer(ddpPolicy);

    // Execute with timing
    const result = await timer.time('threatmetrix', async () => {
      return proofer.proof(tmxApplicant);
    });

    // TODO: Add SP cost tracking
    // Db::SpCost::AddSpCost.call(currentSp, :threatmetrix, transaction_id: result.transactionId)

    return result;
  }

  /**
   * Get the appropriate proofer based on configuration
   */
  private getProofer(ddpPolicy: string): ThreatMetrixProofer | MockThreatMetrixProofer {
    if (this.config.threatmetrixMockEnabled) {
      return new MockThreatMetrixProofer();
    }

    return createThreatMetrixProofer({
      config: {
        apiKey: process.env.LEXISNEXIS_THREATMETRIX_API_KEY || '',
        orgId: process.env.LEXISNEXIS_THREATMETRIX_ORG_ID || '',
        baseUrl: process.env.LEXISNEXIS_THREATMETRIX_BASE_URL || '',
        ddpPolicy,
        timeout: Number(process.env.LEXISNEXIS_THREATMETRIX_TIMEOUT) || 30,
      },
    });
  }

  /**
   * Result when ThreatMetrix is disabled
   */
  private threatmetrixDisabledResult(): DdpResult {
    return new DdpResult({
      success: true,
      client: VENDOR_NAMES.TMX_DISABLED,
      reviewStatus: 'pass',
    });
  }

  /**
   * Result when PII is missing
   */
  private threatmetrixPiiMissingResult(): DdpResult {
    return new DdpResult({
      success: false,
      client: VENDOR_NAMES.TMX_PII_MISSING,
      reviewStatus: 'reject',
    });
  }

  /**
   * Result when session ID is missing
   */
  private threatmetrixIdMissingResult(): DdpResult {
    return new DdpResult({
      success: false,
      client: VENDOR_NAMES.TMX_SESSION_ID_MISSING,
      reviewStatus: 'reject',
    });
  }
}

export function createThreatMetrixPlugin(): ThreatMetrixPlugin {
  return new ThreatMetrixPlugin();
}
