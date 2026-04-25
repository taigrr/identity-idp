/**
 * IdV (Identity Verification) Analytics Events
 * @see app/services/analytics_events.rb
 *
 * These are the most complex events - IDV document capture, proofing, etc.
 */

import { AnalyticsWithEvents } from './events';
import type { FlowPath, DocumentType, ProofingComponents, ErrorDetails } from './types';

export class AnalyticsWithIdvEvents extends AnalyticsWithEvents {
  // IDV Welcome

  idvDocAuthWelcomeVisited(params: {
    step: string;
    analyticsId: string;
    optedInToInPersonProofing?: boolean;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth welcome visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  idvDocAuthWelcomeSubmitted(params: {
    step: string;
    analyticsId: string;
    optedInToInPersonProofing?: boolean;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth welcome submitted', {
      step: params.step,
      analytics_id: params.analyticsId,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  // IDV Agreement

  idvDocAuthAgreementVisited(params: {
    step: string;
    analyticsId: string;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth agreement visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  idvDocAuthAgreementSubmitted(params: {
    success: boolean;
    step: string;
    analyticsId: string;
    optedInToInPersonProofing?: boolean;
    errorDetails?: ErrorDetails;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth agreement submitted', {
      success: params.success,
      step: params.step,
      analytics_id: params.analyticsId,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      error_details: params.errorDetails,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  // IDV Hybrid Handoff

  idvDocAuthHybridHandoffVisited(params: {
    step: string;
    analyticsId: string;
    redoDocumentCapture: boolean;
    selfieCheckRequired: boolean;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth hybrid handoff visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      redo_document_capture: params.redoDocumentCapture,
      selfie_check_required: params.selfieCheckRequired,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  idvDocAuthHybridHandoffSubmitted(params: {
    success: boolean;
    errors?: Record<string, string[]>;
    step: string;
    analyticsId: string;
    redoDocumentCapture: boolean;
    selfieCheckRequired: boolean;
    destination: 'document_capture' | 'send_link';
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    telephonyResponse?: Record<string, unknown>;
  }): void {
    this.trackEvent('IdV: doc auth hybrid handoff submitted', {
      success: params.success,
      errors: params.errors,
      step: params.step,
      analytics_id: params.analyticsId,
      redo_document_capture: params.redoDocumentCapture,
      selfie_check_required: params.selfieCheckRequired,
      destination: params.destination,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      telephony_response: params.telephonyResponse,
    });
  }

  // IDV Document Capture

  idvDocAuthDocumentCaptureVisited(params: {
    step: string;
    analyticsId: string;
    livenessCheckingRequired: boolean;
    selfieCheckRequired: boolean;
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    redoDocumentCapture?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth document_capture visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      liveness_checking_required: params.livenessCheckingRequired,
      selfie_check_required: params.selfieCheckRequired,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      redo_document_capture: params.redoDocumentCapture,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  idvDocAuthDocumentCaptureSubmitted(params: {
    success: boolean;
    step: string;
    analyticsId: string;
    livenessCheckingRequired: boolean;
    selfieCheckRequired: boolean;
    flowPath: FlowPath;
    errors?: Record<string, string[]>;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    redoDocumentCapture?: boolean;
    skipHybridHandoff?: boolean;
    storedResultPresent?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth document_capture submitted', {
      success: params.success,
      step: params.step,
      analytics_id: params.analyticsId,
      liveness_checking_required: params.livenessCheckingRequired,
      selfie_check_required: params.selfieCheckRequired,
      flow_path: params.flowPath,
      errors: params.errors,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      redo_document_capture: params.redoDocumentCapture,
      skip_hybrid_handoff: params.skipHybridHandoff,
      stored_result_present: params.storedResultPresent,
    });
  }

  // IDV SSN

  idvDocAuthSsnVisited(params: {
    step: string;
    analyticsId: string;
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    previousSsnEditDistance?: number;
  }): void {
    this.trackEvent('IdV: doc auth ssn visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      previous_ssn_edit_distance: params.previousSsnEditDistance,
    });
  }

  idvDocAuthSsnSubmitted(params: {
    success: boolean;
    step: string;
    analyticsId: string;
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    errorDetails?: ErrorDetails;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    previousSsnEditDistance?: number;
  }): void {
    this.trackEvent('IdV: doc auth ssn submitted', {
      success: params.success,
      step: params.step,
      analytics_id: params.analyticsId,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      error_details: params.errorDetails,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      previous_ssn_edit_distance: params.previousSsnEditDistance,
    });
  }

  // IDV Verify

  idvDocAuthVerifyVisited(params: {
    step: string;
    analyticsId: string;
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth verify visited', {
      step: params.step,
      analytics_id: params.analyticsId,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  idvDocAuthVerifySubmitted(params: {
    step: string;
    analyticsId: string;
    flowPath: FlowPath;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
  }): void {
    this.trackEvent('IdV: doc auth verify submitted', {
      step: params.step,
      analytics_id: params.analyticsId,
      flow_path: params.flowPath,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
    });
  }

  // IDV Final Resolution

  idvFinal(params: {
    success: boolean;
    fraudReviewPending: boolean;
    fraudRejection: boolean;
    fraudPendingReason?: string;
    gpoVerificationPending: boolean;
    inPersonVerificationPending: boolean;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    deactivationReason?: string;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
    profileHistory?: unknown[];
    proofingWorkflowTimeInSeconds?: number;
  }): void {
    this.trackEvent('IdV: final resolution', {
      success: params.success,
      fraud_review_pending: params.fraudReviewPending,
      fraud_rejection: params.fraudRejection,
      fraud_pending_reason: params.fraudPendingReason,
      gpo_verification_pending: params.gpoVerificationPending,
      in_person_verification_pending: params.inPersonVerificationPending,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      deactivation_reason: params.deactivationReason,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
      profile_history: params.profileHistory,
      proofing_workflow_time_in_seconds: params.proofingWorkflowTimeInSeconds,
    });
  }

  // IDV Cancellation

  idvCancellationVisited(params: {
    step: string;
    requestCameFrom: string;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('IdV: cancellation visited', {
      step: params.step,
      request_came_from: params.requestCameFrom,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  idvCancellationConfirmed(params: {
    step: string;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('IdV: cancellation confirmed', {
      step: params.step,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  idvCancellationGoBack(params: {
    step: string;
    proofingComponents?: ProofingComponents;
    cancelledEnrollment?: boolean;
    enrollmentCode?: string;
    enrollmentId?: number;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('IdV: cancellation go back', {
      step: params.step,
      proofing_components: params.proofingComponents,
      cancelled_enrollment: params.cancelledEnrollment,
      enrollment_code: params.enrollmentCode,
      enrollment_id: params.enrollmentId,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  // IDV Enter Password

  idvEnterPasswordVisited(params: {
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    proofingComponents?: ProofingComponents;
    addressVerificationMethod?: 'phone' | 'gpo';
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('idv_enter_password_visited', {
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      proofing_components: params.proofingComponents,
      address_verification_method: params.addressVerificationMethod,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  idvEnterPasswordSubmitted(params: {
    success: boolean;
    fraudReviewPending: boolean;
    fraudRejection: boolean;
    fraudPendingReason?: string;
    gpoVerificationPending: boolean;
    inPersonVerificationPending: boolean;
    optedInToInPersonProofing?: boolean;
    acuantSdkUpgradeAbTestBucket?: string;
    skipHybridHandoff?: boolean;
    deactivationReason?: string;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
    proofingWorkflowTimeInSeconds?: number;
  }): void {
    this.trackEvent('idv_enter_password_submitted', {
      success: params.success,
      fraud_review_pending: params.fraudReviewPending,
      fraud_rejection: params.fraudRejection,
      fraud_pending_reason: params.fraudPendingReason,
      gpo_verification_pending: params.gpoVerificationPending,
      in_person_verification_pending: params.inPersonVerificationPending,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      acuant_sdk_upgrade_ab_test_bucket: params.acuantSdkUpgradeAbTestBucket,
      skip_hybrid_handoff: params.skipHybridHandoff,
      deactivation_reason: params.deactivationReason,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
      proofing_workflow_time_in_seconds: params.proofingWorkflowTimeInSeconds,
    });
  }

  // IDV GPO (USPS mail verification)

  idvGpoAddressLetterRequested(params: {
    resend: boolean;
    firstLetterRequestedAt?: Date;
    hoursSinceFirstLetter?: number;
    phoneStepAttempts: number;
    optedInToInPersonProofing?: boolean;
    skipHybridHandoff?: boolean;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('IdV: USPS address letter requested', {
      resend: params.resend,
      first_letter_requested_at: params.firstLetterRequestedAt,
      hours_since_first_letter: params.hoursSinceFirstLetter,
      phone_step_attempts: params.phoneStepAttempts,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      skip_hybrid_handoff: params.skipHybridHandoff,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  idvGpoAddressLetterEnqueued(params: {
    enqueuedAt: Date;
    resend: boolean;
    firstLetterRequestedAt?: Date;
    hoursSinceFirstLetter?: number;
    phoneStepAttempts: number;
    optedInToInPersonProofing?: boolean;
    skipHybridHandoff?: boolean;
    proofingComponents?: ProofingComponents;
    activeProfileIdvLevel?: string;
    pendingProfileIdvLevel?: string;
  }): void {
    this.trackEvent('IdV: USPS address letter enqueued', {
      enqueued_at: params.enqueuedAt,
      resend: params.resend,
      first_letter_requested_at: params.firstLetterRequestedAt,
      hours_since_first_letter: params.hoursSinceFirstLetter,
      phone_step_attempts: params.phoneStepAttempts,
      opted_in_to_in_person_proofing: params.optedInToInPersonProofing,
      skip_hybrid_handoff: params.skipHybridHandoff,
      proofing_components: params.proofingComponents,
      active_profile_idv_level: params.activeProfileIdvLevel,
      pending_profile_idv_level: params.pendingProfileIdvLevel,
    });
  }

  idvGpoExpired(params: {
    userId: string;
    userHasActiveProfile: boolean;
    lettersSent: number;
    gpoVerificationPendingAt?: Date;
  }): void {
    this.trackEvent('idv_gpo_expired', {
      user_id: params.userId,
      user_has_active_profile: params.userHasActiveProfile,
      letters_sent: params.lettersSent,
      gpo_verification_pending_at: params.gpoVerificationPendingAt,
    });
  }

  // Frontend events (captured from client JS)

  idvFrontImageAdded(params: {
    acuantCaptureMode: string;
    acuantSdkUpgradeAbTestingEnabled: boolean;
    acuantVersion: string;
    assessment: boolean;
    captureAttempts: number;
    documentType: string;
    dpi: number;
    failedImageResubmission: number;
    fingerprint: string;
    flowPath: FlowPath;
    glare: number;
    glareScoreThreshold: number;
    height: number;
    isAssessedAsBlurry: boolean;
    isAssessedAsGlare: boolean;
    isAssessedAsUnsupported: boolean;
    mimeType: string;
    moire: number;
    sharpness: number;
    sharpnessScoreThreshold: number;
    size: number;
    source: string;
    useAlternateSdk: boolean;
    livenessCheckingRequired: boolean;
    width: number;
  }): void {
    this.trackEvent('Frontend: IdV: front image added', params);
  }

  idvBackImageAdded(params: {
    acuantCaptureMode: string;
    acuantSdkUpgradeAbTestingEnabled: boolean;
    acuantVersion: string;
    assessment: boolean;
    captureAttempts: number;
    documentType: string;
    dpi: number;
    failedImageResubmission: number;
    fingerprint: string;
    flowPath: FlowPath;
    glare: number;
    glareScoreThreshold: number;
    height: number;
    isAssessedAsBlurry: boolean;
    isAssessedAsGlare: boolean;
    isAssessedAsUnsupported: boolean;
    mimeType: string;
    moire: number;
    sharpness: number;
    sharpnessScoreThreshold: number;
    size: number;
    source: string;
    useAlternateSdk: boolean;
    livenessCheckingRequired: boolean;
    width: number;
  }): void {
    this.trackEvent('Frontend: IdV: back image added', params);
  }

  // Doc auth warning

  docAuthWarning(params: {
    message?: string;
    unknownAlerts?: string[];
    responseInfo?: Record<string, unknown>;
  }): void {
    this.trackEvent('Doc Auth Warning', {
      message: params.message,
      unknown_alerts: params.unknownAlerts,
      response_info: params.responseInfo,
    });
  }
}

export { AnalyticsWithIdvEvents as AnalyticsEvents };
