/**
 * JWKS (JSON Web Key Set) Endpoint
 * /api/openid-connect/certs
 * Mirrors: app/controllers/openid_connect/certs_controller.rb
 */

import { NextResponse } from 'next/server';
import { generateJwks } from '@/lib/oidc';

export async function GET() {
  const jwks = await generateJwks();

  return NextResponse.json(jwks, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
