import { NextRequest, NextResponse } from 'next/server';

/**
 * RISC Security Events Endpoint
 * Mirrors: app/controllers/risc/security_events_controller.rb
 * Route: POST /api/risc/security-events
 */

interface SecurityEventToken {
  iss: string;
  aud: string;
  iat: number;
  jti: string;
  events: Record<string, {
    subject: {
      format: string;
      iss?: string;
      sub?: string;
    };
  }>;
}

// TODO: Replace with actual implementations
async function validateSecurityEventToken(token: string): Promise<{
  valid: boolean;
  payload?: SecurityEventToken;
  error?: string;
}> {
  // In production, verify JWT signature against issuer's JWKS
  try {
    // Decode and validate the SET (Security Event Token)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode payload (simplified - in production use proper JWT library)
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as SecurityEventToken;

    // Validate required fields
    if (!payload.iss || !payload.aud || !payload.events) {
      return { valid: false, error: 'Missing required fields' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Failed to parse token' };
  }
}

async function processSecurityEvent(event: SecurityEventToken): Promise<void> {
  // TODO: Process the security event (update user status, log, etc.)
  console.log('Processing security event:', {
    issuer: event.iss,
    eventTypes: Object.keys(event.events),
    jti: event.jti,
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');

  // Accept both application/secevent+jwt and application/jwt
  if (!contentType?.includes('jwt')) {
    return NextResponse.json(
      { error: 'invalid_content_type', description: 'Content-Type must be application/secevent+jwt' },
      { status: 400 },
    );
  }

  const token = await request.text();

  if (!token) {
    return NextResponse.json(
      { error: 'invalid_request', description: 'Missing security event token' },
      { status: 400 },
    );
  }

  const validation = await validateSecurityEventToken(token);

  if (!validation.valid || !validation.payload) {
    return NextResponse.json(
      { error: 'invalid_token', description: validation.error || 'Token validation failed' },
      { status: 400 },
    );
  }

  try {
    await processSecurityEvent(validation.payload);

    // Return 202 Accepted to indicate the event was received and will be processed
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error('Failed to process security event:', error);
    return NextResponse.json(
      { error: 'server_error', description: 'Failed to process security event' },
      { status: 500 },
    );
  }
}
