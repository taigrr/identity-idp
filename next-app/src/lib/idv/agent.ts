/**
 * IDV Agent
 * Migrated from Rails app/services/idv/agent.rb
 * 
 * Orchestrates the identity verification proofing process by
 * dispatching background jobs for resolution and address proofing.
 */

export interface ApplicantPii {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  ssn?: string;
  stateIdNumber?: string;
  stateIdType?: string;
  stateIdJurisdiction?: string;
}

export interface DocumentCaptureSession {
  uuid: string;
  resultId: string;
  userId: string;
  issuer?: string;
  createProofingSession: () => Promise<void>;
}

export interface ProofResolutionOptions {
  traceId: string;
  threatmetrixSessionId?: string;
  requestIp: string;
  ippEnrollmentInProgress: boolean;
  proofingVendor: string;
  stateIdAlreadyProofed?: boolean;
  hybridMobileThreatmetrixSessionId?: string;
  hybridMobileRequestIp?: string;
}

export interface ProofAddressOptions {
  issuer?: string;
  traceId: string;
}

export interface ResolutionProofingJobArgs {
  encryptedArguments: string;
  traceId: string;
  resultId: string;
  userId: string;
  serviceProviderIssuer?: string;
  threatmetrixSessionId?: string;
  requestIp: string;
  hybridMobileThreatmetrixSessionId?: string;
  hybridMobileRequestIp?: string;
  ippEnrollmentInProgress: boolean;
  proofingVendor: string;
  stateIdAlreadyProofed: boolean;
}

export interface AddressProofingJobArgs {
  userId: string;
  issuer?: string;
  encryptedArguments: string;
  resultId: string;
  traceId: string;
  addressVendor: string;
}

export interface IdvAgentDeps {
  encryptProofingArgs: (data: { applicantPii: ApplicantPii }) => Promise<string>;
  enqueueResolutionProofingJob: (args: ResolutionProofingJobArgs) => Promise<void>;
  enqueueAddressProofingJob: (args: AddressProofingJobArgs) => Promise<void>;
  runJobsAsync: boolean;
  addressPrimaryVendor: string;
}

export class IdvAgent {
  private applicant: ApplicantPii;
  private deps: IdvAgentDeps;

  constructor(applicant: ApplicantPii, deps: IdvAgentDeps) {
    this.applicant = applicant;
    this.deps = deps;
  }

  async proofResolution(
    documentCaptureSession: DocumentCaptureSession,
    options: ProofResolutionOptions
  ): Promise<void> {
    await documentCaptureSession.createProofingSession();

    const encryptedArguments = await this.deps.encryptProofingArgs({
      applicantPii: this.applicant,
    });

    const jobArguments: ResolutionProofingJobArgs = {
      encryptedArguments,
      traceId: options.traceId,
      resultId: documentCaptureSession.resultId,
      userId: documentCaptureSession.userId,
      serviceProviderIssuer: documentCaptureSession.issuer,
      threatmetrixSessionId: options.threatmetrixSessionId,
      requestIp: options.requestIp,
      hybridMobileThreatmetrixSessionId: options.hybridMobileThreatmetrixSessionId,
      hybridMobileRequestIp: options.hybridMobileRequestIp,
      ippEnrollmentInProgress: options.ippEnrollmentInProgress,
      proofingVendor: options.proofingVendor,
      stateIdAlreadyProofed: options.stateIdAlreadyProofed ?? false,
    };

    await this.deps.enqueueResolutionProofingJob(jobArguments);
  }

  async proofAddress(
    documentCaptureSession: DocumentCaptureSession,
    options: ProofAddressOptions
  ): Promise<void> {
    await documentCaptureSession.createProofingSession();

    const encryptedArguments = await this.deps.encryptProofingArgs({
      applicantPii: this.applicant,
    });

    const jobArguments: AddressProofingJobArgs = {
      userId: documentCaptureSession.userId,
      issuer: options.issuer,
      encryptedArguments,
      resultId: documentCaptureSession.resultId,
      traceId: options.traceId,
      addressVendor: this.deps.addressPrimaryVendor,
    };

    await this.deps.enqueueAddressProofingJob(jobArguments);
  }
}

export function createIdvAgent(
  applicant: ApplicantPii,
  deps: IdvAgentDeps
): IdvAgent {
  return new IdvAgent(applicant, deps);
}
