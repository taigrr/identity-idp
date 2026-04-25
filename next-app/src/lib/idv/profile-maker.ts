/**
 * IDV Profile Maker
 * Migrated from Rails app/services/idv/profile_maker.rb
 * 
 * Creates and saves verified user profiles with encrypted PII.
 */

import { PiiAttributes } from '../pii/types';

export type IdvLevel =
  | 'legacy_unsupervised'
  | 'unsupervised_with_selfie'
  | 'legacy_in_person'
  | 'in_person'
  | 'proofing_agent';

export interface Profile {
  id?: string;
  userId: string;
  active: boolean;
  deactivationReason?: string | null;
  fraudPendingReason?: string | null;
  idvLevel?: IdvLevel;
  proofingComponents?: ProofingComponents;
  initiatingServiceProviderId?: string;
  encryptedPii?: string;
  encryptedPiiRecovery?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProofingComponents {
  documentCheck?: string;
  documentType?: string;
  sourceCheck?: string;
  resolutionCheck?: string;
  addressCheck?: string;
  threatmetrixReviewStatus?: string;
  threatmetrixRiskRating?: string;
}

export interface ProfileMakerConfig {
  inPersonProofingEnforceTmx: boolean;
  proofingDeviceProfilingDecisioningEnabled: boolean;
}

export interface ProfileMakerDeps {
  config: ProfileMakerConfig;
  encryptPii: (
    piiAttributes: PiiAttributes,
    userPassword: string
  ) => Promise<{ encryptedPii: string; encryptedPiiRecovery: string }>;
  saveProfile: (profile: Profile) => Promise<Profile>;
  deactivateForGpoVerification: (profileId: string) => Promise<void>;
  deactivateForFraudReview: (profileId: string) => Promise<void>;
  deactivateForInPersonVerification: (profileId: string) => Promise<void>;
}

export interface ProfileMakerOptions {
  applicant: Record<string, unknown>;
  user: { id: string };
  userPassword: string;
  initiatingServiceProvider?: { id: string };
}

export interface SaveProfileOptions {
  fraudPendingReason?: string | null;
  gpoVerificationNeeded: boolean;
  inPersonVerificationNeeded: boolean;
  selfieCheckPerformed: boolean;
  proofingComponents: ProofingComponents;
  deactivationReason?: string | null;
  proofingAgentRequested?: boolean;
}

export class ProfileMaker {
  readonly piiAttributes: PiiAttributes;
  private user: { id: string };
  private userPassword: string;
  private initiatingServiceProvider?: { id: string };
  private deps: ProfileMakerDeps;

  constructor(options: ProfileMakerOptions, deps: ProfileMakerDeps) {
    this.piiAttributes = options.applicant as PiiAttributes;
    this.user = options.user;
    this.userPassword = options.userPassword;
    this.initiatingServiceProvider = options.initiatingServiceProvider;
    this.deps = deps;
  }

  async saveProfile(options: SaveProfileOptions): Promise<Profile> {
    const encrypted = await this.deps.encryptPii(
      this.piiAttributes,
      this.userPassword
    );

    const idvLevel = this.setIdvLevel({
      inPersonVerificationNeeded: options.inPersonVerificationNeeded,
      selfieCheckPerformed: options.selfieCheckPerformed,
      proofingAgentRequested: options.proofingAgentRequested ?? false,
    });

    const profile: Profile = {
      userId: this.user.id,
      active: false,
      deactivationReason: options.deactivationReason ?? null,
      fraudPendingReason: options.fraudPendingReason ?? null,
      idvLevel,
      proofingComponents: options.proofingComponents,
      initiatingServiceProviderId: this.initiatingServiceProvider?.id,
      encryptedPii: encrypted.encryptedPii,
      encryptedPiiRecovery: encrypted.encryptedPiiRecovery,
    };

    const savedProfile = await this.deps.saveProfile(profile);

    if (options.inPersonVerificationNeeded) {
      await this.deps.deactivateForInPersonVerification(savedProfile.id!);
    }

    if (options.gpoVerificationNeeded) {
      await this.deps.deactivateForGpoVerification(savedProfile.id!);
    }

    if (
      options.fraudPendingReason &&
      !options.gpoVerificationNeeded &&
      !options.inPersonVerificationNeeded
    ) {
      await this.deps.deactivateForFraudReview(savedProfile.id!);
    }

    return savedProfile;
  }

  private setIdvLevel(options: {
    inPersonVerificationNeeded: boolean;
    selfieCheckPerformed: boolean;
    proofingAgentRequested: boolean;
  }): IdvLevel {
    if (options.inPersonVerificationNeeded) {
      if (
        this.deps.config.inPersonProofingEnforceTmx &&
        this.deps.config.proofingDeviceProfilingDecisioningEnabled
      ) {
        return 'in_person';
      }
      return 'legacy_in_person';
    }

    if (options.selfieCheckPerformed) {
      return 'unsupervised_with_selfie';
    }

    if (options.proofingAgentRequested) {
      return 'proofing_agent';
    }

    return 'legacy_unsupervised';
  }
}

export function createProfileMaker(
  options: ProfileMakerOptions,
  deps: ProfileMakerDeps
): ProfileMaker {
  return new ProfileMaker(options, deps);
}
