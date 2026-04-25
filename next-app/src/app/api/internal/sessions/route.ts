import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal Sessions API
 * Mirrors: app/controllers/api/internal/sessions_controller.rb
 * Route: GET/PUT /api/internal/sessions
 */

interface SessionStatus {
  live: boolean;
  timeout: number;
  remaining?: number;
}

const SESSION_TIMEOUT = 900; // 15 minutes in seconds

// TODO: Replace with actual Redis/session store
async function getSessionLiveness(sessionId: string): Promise<SessionStatus> {
  console.log('Checking session liveness:', sessionId?.slice(0, 8) + '...');
  return {
    live: true,
    timeout: SESSION_TIMEOUT,
    remaining: 840,
  };
}

async function extendSession(sessionId: string): Promise<SessionStatus> {
  console.log('Extending session:', sessionId?.slice(0, 8) + '...');
  return {
    live: true,
    timeout: SESSION_TIMEOUT,
    remaining: SESSION_TIMEOUT,
  };
}

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { live: false, timeout: 0 },
      { status: 401 },
    );
  }

  const status = await getSessionLiveness(sessionId);

  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const sessionId = request.cookies.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { live: false, timeout: 0 },
      { status: 401 },
    );
  }

  const status = await extendSession(sessionId);

  return NextResponse.json(status);
}
