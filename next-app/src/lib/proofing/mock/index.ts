/**
 * Mock Module - Mock proofers for testing and development
 * Mirrors: app/services/proofing/mock/
 */

export {
  MockResolutionProofer,
  MockAamvaProofer,
  MockThreatMetrixProofer,
  createMockResolutionProofer,
  createMockAamvaProofer,
  createMockThreatMetrixProofer,
  type MockProofingConfig,
  DEFAULT_MOCK_CONFIG,
  MOCK_SSN_TRIGGERS,
} from './client';
