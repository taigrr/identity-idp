/**
 * AuthnContext Resolver
 * Migrated from Rails app/services/authn_context_resolver.rb
 * 
 * Resolves AAL (Authentication Assurance Level) and IAL (Identity Assurance Level)
 * from ACR (Authentication Context Class Reference) values.
 */

import {
  ACR_VALUES,
  ACR_TO_IAL,
  FACIAL_MATCH_IAL_CONTEXTS,
  FACIAL_MATCH_REQUIRED_IAL_CONTEXTS,
} from './constants';

// Semantic ACRs
const SEMANTIC_ACRS = [
  'urn:acr.login.gov:verified',
  'urn:acr.login.gov:auth-only',
  'urn:acr.login.gov:verified-facial-match-required',
  'urn:acr.login.gov:verified-facial-match-preferred',
];

// Legacy to semantic ACR mapping
const LEGACY_ACRS_TO_SEMANTIC_ACRS: Record<string, string> = {
  [ACR_VALUES.IAL1]: 'urn:acr.login.gov:auth-only',
  [ACR_VALUES.IAL2]: 'urn:acr.login.gov:verified',
  [ACR_VALUES.IAL2_BIO_REQUIRED]: 'urn:acr.login.gov:verified-facial-match-required',
};

export interface AcrResult {
  aal2: boolean;
  phishingResistant: boolean;
  hspd12: boolean;
  identityProofing: boolean;
  ialmax: boolean;
  facialMatch: boolean;
  twoPiecesOfFairEvidence: boolean;
  componentValues: ComponentValue[];
  componentNames: string[];
}

export interface ComponentValue {
  name: string;
}

export interface ServiceProvider {
  issuer: string;
  defaultAal?: number;
  identityProofingAllowed?: boolean;
}

export interface User {
  id: string;
  identityVerified: boolean;
  identityVerifiedWithFacialMatch?: boolean;
}

export interface AuthnContextResolverOptions {
  user?: User | null;
  serviceProvider?: ServiceProvider | null;
  acrValues?: string | null;
}

export function parseAcrValues(acrValues?: string | null): AcrResult {
  if (!acrValues) {
    return createEmptyAcrResult();
  }

  const values = acrValues.split(' ').filter(Boolean);
  const componentValues = values.map(name => ({ name }));
  const componentNames = values;

  return {
    aal2: values.some(v => 
      v.includes('aal/2') || 
      v === ACR_VALUES.AAL2 ||
      v === ACR_VALUES.AAL2_PHISHING_RESISTANT ||
      v === ACR_VALUES.AAL2_HSPD12
    ),
    phishingResistant: values.some(v => 
      v.includes('phishing_resistant') ||
      v === ACR_VALUES.AAL2_PHISHING_RESISTANT
    ),
    hspd12: values.some(v => 
      v.includes('hspd12') ||
      v === ACR_VALUES.AAL2_HSPD12
    ),
    identityProofing: values.some(v => 
      v.includes('ial/2') ||
      v === ACR_VALUES.IAL2 ||
      v === ACR_VALUES.IAL2_BIO_REQUIRED ||
      ACR_TO_IAL[v] === 2
    ),
    ialmax: values.some(v => v.includes('ialmax') || v === ACR_VALUES.IAL_MAX),
    facialMatch: values.some(v => 
      v.includes('facial_match') ||
      (FACIAL_MATCH_IAL_CONTEXTS as readonly string[]).includes(v)
    ),
    twoPiecesOfFairEvidence: values.some(v => v.includes('two_pieces_of_fair_evidence')),
    componentValues,
    componentNames,
  };
}

function createEmptyAcrResult(): AcrResult {
  return {
    aal2: false,
    phishingResistant: false,
    hspd12: false,
    identityProofing: false,
    ialmax: false,
    facialMatch: false,
    twoPiecesOfFairEvidence: false,
    componentValues: [],
    componentNames: [],
  };
}

export class AuthnContextResolver {
  private user?: User | null;
  private serviceProvider?: ServiceProvider | null;
  private acrValues?: string | null;
  private _result?: AcrResult;

  constructor(options: AuthnContextResolverOptions) {
    this.user = options.user;
    this.serviceProvider = options.serviceProvider;
    this.acrValues = options.acrValues;
  }

  get result(): AcrResult {
    if (!this._result) {
      this._result = this.decorateAcrResultWithUserContext(
        this.acrResultWithSpDefaults()
      );
    }
    return this._result;
  }

  get assertedIalAcr(): string {
    if (!this.user?.identityVerified) {
      return this.resolveAcr(ACR_VALUES.IAL1);
    }

    if (this.result.facialMatch) {
      return this.resolveAcr(ACR_VALUES.IAL2_BIO_REQUIRED);
    }

    if (this.result.identityProofing || this.result.ialmax) {
      return this.resolveAcr(ACR_VALUES.IAL2);
    }

    return this.resolveAcr(ACR_VALUES.IAL1);
  }

  get assertedAalAcr(): string {
    if (this.result.hspd12) {
      return ACR_VALUES.AAL2_HSPD12;
    }
    if (this.result.phishingResistant) {
      return ACR_VALUES.AAL2_PHISHING_RESISTANT;
    }
    if (this.result.aal2) {
      return ACR_VALUES.AAL2;
    }
    return ACR_VALUES.AAL1;
  }

  private acrResultWithSpDefaults(): AcrResult {
    return this.resultWithSpAalDefaults(
      this.resultWithSpIalDefaults(
        this.acrResultWithoutSpDefaults()
      )
    );
  }

  private acrResultWithoutSpDefaults(): AcrResult {
    return parseAcrValues(this.acrValues);
  }

  private resultWithSpAalDefaults(result: AcrResult): AcrResult {
    if (this.acrAalComponentValues().length > 0) {
      return result;
    }

    const defaultAal = this.serviceProvider?.defaultAal ?? 0;
    
    if (defaultAal === 2) {
      return { ...result, aal2: true };
    }
    
    if (defaultAal >= 3) {
      return { ...result, aal2: true, phishingResistant: true };
    }

    return result;
  }

  private resultWithSpIalDefaults(result: AcrResult): AcrResult {
    if (this.acrIalComponentValues().length > 0) {
      return result;
    }

    if (this.serviceProvider?.identityProofingAllowed) {
      return { ...result, identityProofing: true, aal2: true };
    }

    return result;
  }

  private decorateAcrResultWithUserContext(result: AcrResult): AcrResult {
    if (!result.facialMatch) {
      return result;
    }

    if (this.user?.identityVerifiedWithFacialMatch || this.facialMatchIsRequired(result)) {
      return result;
    }

    if (this.user?.identityVerified) {
      return { ...result, facialMatch: false, twoPiecesOfFairEvidence: false };
    }

    return { ...result, facialMatch: true };
  }

  private acrAalComponentValues(): ComponentValue[] {
    return this.acrResultWithoutSpDefaults().componentValues.filter(cv =>
      cv.name.includes('aal') || cv.name === ACR_VALUES.DEFAULT_AAL
    );
  }

  private acrIalComponentValues(): ComponentValue[] {
    return this.acrResultWithoutSpDefaults().componentValues.filter(cv =>
      cv.name in ACR_TO_IAL
    );
  }

  private resolveAcr(acr: string): string {
    if (!this.useSemanticAuthnContexts()) {
      return acr;
    }
    return LEGACY_ACRS_TO_SEMANTIC_ACRS[acr] ?? acr;
  }

  private facialMatchIsRequired(result: AcrResult): boolean {
    return FACIAL_MATCH_REQUIRED_IAL_CONTEXTS.some(ctx =>
      result.componentNames.includes(ctx)
    );
  }

  private useSemanticAuthnContexts(): boolean {
    if (!this.acrValues) return false;
    return SEMANTIC_ACRS.some(acr => this.acrValues!.includes(acr));
  }
}

export function createAuthnContextResolver(
  options: AuthnContextResolverOptions
): AuthnContextResolver {
  return new AuthnContextResolver(options);
}
