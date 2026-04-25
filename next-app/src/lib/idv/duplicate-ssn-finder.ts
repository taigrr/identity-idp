/**
 * Duplicate SSN Finder
 * Migrated from Rails app/services/idv/duplicate_ssn_finder.rb
 * and app/services/duplicate_profile_checker.rb
 * 
 * Detects duplicate SSN fraud attempts.
 */

export interface DuplicateSsnProfile {
  id: string;
  userId: string;
  active: boolean;
  ssnSignature?: string | null;
  deactivationReason?: string | null;
  fraudPendingReason?: string | null;
  idvLevel?: string | null;
}

export interface DuplicateSsnFinderDeps {
  findProfilesBySsnSignature: (ssnSignature: string) => Promise<DuplicateSsnProfile[]>;
  createSsnSignature: (ssn: string) => string;
}

export interface DuplicateSsnResult {
  isDuplicate: boolean;
  conflictingProfiles: DuplicateSsnProfile[];
  sameUser: boolean;
}

export async function findDuplicateSsn(
  ssn: string,
  userId: string,
  deps: DuplicateSsnFinderDeps
): Promise<DuplicateSsnResult> {
  const ssnSignature = deps.createSsnSignature(ssn);
  const profiles = await deps.findProfilesBySsnSignature(ssnSignature);
  
  const otherUserProfiles = profiles.filter(p => p.userId !== userId && p.active);
  const sameUserProfiles = profiles.filter(p => p.userId === userId);

  return {
    isDuplicate: otherUserProfiles.length > 0,
    conflictingProfiles: otherUserProfiles,
    sameUser: sameUserProfiles.length > 0,
  };
}

export interface DuplicateProfileCheckerDeps {
  findActiveProfilesBySsnSignature: (ssnSignature: string) => Promise<DuplicateSsnProfile[]>;
  createSsnSignature: (ssn: string) => string;
}

export interface DuplicateProfileResult {
  hasDuplicateProfile: boolean;
  duplicateProfile: DuplicateSsnProfile | null;
  canProceed: boolean;
  errors: string[];
}

export async function checkDuplicateProfile(
  ssn: string,
  userId: string,
  deps: DuplicateProfileCheckerDeps
): Promise<DuplicateProfileResult> {
  const ssnSignature = deps.createSsnSignature(ssn);
  const profiles = await deps.findActiveProfilesBySsnSignature(ssnSignature);
  
  const otherUserProfile = profiles.find(p => p.userId !== userId);
  
  if (!otherUserProfile) {
    return {
      hasDuplicateProfile: false,
      duplicateProfile: null,
      canProceed: true,
      errors: [],
    };
  }

  return {
    hasDuplicateProfile: true,
    duplicateProfile: otherUserProfile,
    canProceed: false,
    errors: ['This SSN is already associated with another account'],
  };
}

export class DuplicateSsnFinder {
  private deps: DuplicateSsnFinderDeps;

  constructor(deps: DuplicateSsnFinderDeps) {
    this.deps = deps;
  }

  async find(ssn: string, userId: string): Promise<DuplicateSsnResult> {
    return findDuplicateSsn(ssn, userId, this.deps);
  }
}

export class DuplicateProfileChecker {
  private deps: DuplicateProfileCheckerDeps;

  constructor(deps: DuplicateProfileCheckerDeps) {
    this.deps = deps;
  }

  async check(ssn: string, userId: string): Promise<DuplicateProfileResult> {
    return checkDuplicateProfile(ssn, userId, this.deps);
  }
}
