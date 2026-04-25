import { NextResponse } from 'next/server';

/**
 * RISC Configuration Endpoint
 * Mirrors: app/controllers/risc/configuration_controller.rb
 * Route: GET /.well-known/risc-configuration
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const configuration = {
    issuer: baseUrl,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    delivery_methods_supported: ['https://schemas.openid.net/secevent/risc/delivery-method/push'],
    delivery: {
      'https://schemas.openid.net/secevent/risc/delivery-method/push': {
        endpoint_url: `${baseUrl}/api/risc/security-events`,
      },
    },
    events_supported: [
      'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
      'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
      'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required',
      'https://schemas.openid.net/secevent/risc/event-type/identifier-changed',
      'https://schemas.openid.net/secevent/risc/event-type/identifier-recycled',
    ],
    events_requested: [
      'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
      'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
    ],
    subject_identifier_formats_supported: ['iss_sub'],
    critical_subject_members: ['iss', 'sub'],
  };

  return NextResponse.json(configuration, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
