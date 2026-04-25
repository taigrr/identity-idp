/**
 * IDV Hybrid Mobile Entry Actions
 * Mirrors: app/controllers/idv/hybrid_mobile/entry_controller.rb
 */

'use server';

interface ValidateSessionResult {
  success: boolean;
  sessionData?: {
    flowPath: string;
    serviceProviderName?: string;
  };
  error?: string;
}

interface UpdateSessionResult {
  success: boolean;
  error?: string;
}

export async function validateHybridSession(
  sessionUuid: string
): Promise<ValidateSessionResult> {
  if (!sessionUuid) {
    return { success: false, error: 'Missing session identifier' };
  }

  // TODO: Look up hybrid session by UUID from document_capture_sessions table
  // For now, return mock data

  return {
    success: true,
    sessionData: {
      flowPath: 'hybrid',
      serviceProviderName: 'Example Agency',
    },
  };
}

export async function updateHybridSession(
  sessionUuid: string,
  data: Record<string, unknown>
): Promise<UpdateSessionResult> {
  if (!sessionUuid) {
    return { success: false, error: 'Missing session identifier' };
  }

  // TODO: Update hybrid session data

  return { success: true };
}

// Alias for page compatibility
export const initializeHybridSession = validateHybridSession;
