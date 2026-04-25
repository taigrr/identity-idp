/**
 * Progressive Proofer - Orchestrates all identity proofing steps
 * Mirrors: app/services/proofing/resolution/progressive_proofer.rb
 */

import type { ApplicantPii, ProofingVendor } from '../types';
import { PROOFING_VENDOR_SP_COST_TOKENS } from '../types';
import { InstantVerifyProofer, createInstantVerifyProofer } from '../lexis-nexis/instant-verify-proofer';
import { createLexisNexisConfig } from '../lexis-nexis/config';
import { MockResolutionProofer, createMockResolutionProofer } from '../mock/client';
import { AamvaPlugin, createAamvaPlugin } from './plugins/aamva-plugin';
import { ThreatMetrixPlugin, createThreatMetrixPlugin } from './plugins/threatmetrix-plugin';
import { ResidentialAddressPlugin, createResidentialAddressPlugin } from './plugins/residential-address-plugin';
import { StateIdAddressPlugin, createStateIdAddressPlugin } from './plugins/state-id-address-plugin';
import { ResultAdjudicator, createResultAdjudicator, type AdjudicatedResult, type PhoneResult } from './result-adjudicator';
import { SimpleTimer, type ProofingTimer, type CurrentSP, getProofingConfig } from './plugins/types';

export interface ProgressiveProoferOptions {
  userUuid: string;
  userEmail: string;
  proofingVendor: ProofingVendor;
}

export interface ProofParams {
  applicantPii: ApplicantPii;
  requestIp: string;
  threatmetrixSessionId: string;
  timer?: ProofingTimer;
  ippEnrollmentInProgress: boolean;
  currentSp: CurrentSP;
  workflow: string;
  stateIdAlreadyProofed?: boolean;
  hybridMobileThreatmetrixSessionId?: string;
  hybridMobileRequestIp?: string;
}

/**
 * Progressive Proofer - Main orchestrator for identity proofing
 */
export class ProgressiveProofer {
  private userUuid: string;
  private userEmail: string;
  private proofingVendor: ProofingVendor;

  private aamvaPlugin: AamvaPlugin;
  private threatmetrixPlugin: ThreatMetrixPlugin;
  private config = getProofingConfig();

  constructor(options: ProgressiveProoferOptions) {
    this.userUuid = options.userUuid;
    this.userEmail = options.userEmail;
    this.proofingVendor = options.proofingVendor;

    this.aamvaPlugin = createAamvaPlugin();
    this.threatmetrixPlugin = createThreatMetrixPlugin();
  }

  /**
   * Execute all proofing steps
   */
  async proof(params: ProofParams): Promise<AdjudicatedResult> {
    const {
      applicantPii: rawApplicantPii,
      requestIp,
      threatmetrixSessionId,
      ippEnrollmentInProgress,
      currentSp,
      workflow,
      stateIdAlreadyProofed = false,
      hybridMobileThreatmetrixSessionId,
      hybridMobileRequestIp,
    } = params;

    const timer = params.timer || new SimpleTimer();

    // Extract best effort phone and clean PII
    const bestEffortPhone = rawApplicantPii.best_effort_phone_number_for_socure;
    const applicantPii = { ...rawApplicantPii };
    delete applicantPii.best_effort_phone_number_for_socure;

    // Create resolution proofer
    const proofer = this.createProofer();
    const spCostToken = this.getSpCostToken();

    // Create address plugins
    const residentialAddressPlugin = createResidentialAddressPlugin({
      proofer,
      spCostToken,
    });

    const stateIdAddressPlugin = createStateIdAddressPlugin({
      proofer,
      spCostToken,
    });

    // 1. Device profiling (ThreatMetrix)
    const deviceProfilingResult = await this.threatmetrixPlugin.call({
      applicantPii,
      currentSp,
      threatmetrixSessionId,
      requestIp,
      timer,
      userEmail: this.userEmail,
      userUuid: this.userUuid,
      workflow,
      ddpPolicy: this.config.threatmetrixPolicy,
    });

    // 2. Hybrid mobile device profiling (if applicable)
    let hybridMobileDeviceProfilingResult = null;
    if (hybridMobileRequestIp && hybridMobileThreatmetrixSessionId) {
      hybridMobileDeviceProfilingResult = await this.threatmetrixPlugin.call({
        applicantPii,
        currentSp,
        threatmetrixSessionId: hybridMobileThreatmetrixSessionId,
        requestIp: hybridMobileRequestIp,
        timer,
        userEmail: this.userEmail,
        userUuid: this.userUuid,
        workflow: `${workflow}_hybrid_handoff`,
        ddpPolicy: this.config.threatmetrixPolicy,
      });
    }

    // 3. Residential address verification (IPP only)
    const residentialAddressResolutionResult = await residentialAddressPlugin.call({
      applicantPii,
      currentSp,
      ippEnrollmentInProgress,
      timer,
    });

    // 4. State ID address resolution
    const stateIdAddressResolutionResult = await stateIdAddressPlugin.call({
      applicantPii,
      currentSp,
      residentialAddressResolutionResult,
      ippEnrollmentInProgress,
      timer,
    });

    // 5. AAMVA state ID verification
    const stateIdResult = await this.aamvaPlugin.call({
      applicantPii,
      currentSp,
      stateIdAddressResolutionResult,
      ippEnrollmentInProgress,
      timer,
      alreadyProofed: stateIdAlreadyProofed,
    });

    // 6. Phone precheck (simplified - full implementation would use PhonePlugin)
    const phoneResult: PhoneResult = {
      success: true,
      vendorName: 'phone_precheck_skipped',
    };

    // 7. Adjudicate results
    const shouldProofStateId = this.aamvaPlugin.aamvaSupportsStateIdJurisdiction(applicantPii);

    const adjudicator = createResultAdjudicator({
      resolutionResult: stateIdAddressResolutionResult,
      stateIdResult,
      residentialResolutionResult: residentialAddressResolutionResult,
      phoneResult,
      shouldProofStateId,
      ippEnrollmentInProgress,
      deviceProfilingResult,
      sameAddressAsId: applicantPii.same_address_as_id || 'true',
      applicantPii,
      precheckPhoneNumber: applicantPii.phone || null,
      hybridMobileDeviceProfilingResult,
    });

    return adjudicator.adjudicatedResult();
  }

  /**
   * Create the resolution proofer based on vendor
   */
  private createProofer(): InstantVerifyProofer | MockResolutionProofer {
    switch (this.proofingVendor) {
      case 'mock':
        return createMockResolutionProofer();

      case 'instant_verify':
        return createInstantVerifyProofer({
          config: createLexisNexisConfig(),
        });

      case 'instant_verify_ddp':
        // DDP variant uses same proofer with different config
        return createInstantVerifyProofer({
          config: createLexisNexisConfig(),
        });

      case 'socure_kyc':
        // TODO: Implement Socure KYC proofer
        throw new Error('Socure KYC proofer not yet implemented');

      default:
        throw new Error(`Invalid proofing vendor: ${this.proofingVendor}`);
    }
  }

  /**
   * Get SP cost token for the vendor
   */
  private getSpCostToken(): string {
    const token = PROOFING_VENDOR_SP_COST_TOKENS[this.proofingVendor];
    if (!token) {
      throw new Error(`No cost token present for proofing vendor ${this.proofingVendor}`);
    }
    return token;
  }
}

/**
 * Factory function to create Progressive Proofer
 */
export function createProgressiveProofer(options: ProgressiveProoferOptions): ProgressiveProofer {
  return new ProgressiveProofer(options);
}
