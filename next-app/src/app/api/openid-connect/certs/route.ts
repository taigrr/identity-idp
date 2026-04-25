/**
 * JWKS (JSON Web Key Set) Endpoint
 * /api/openid-connect/certs
 * Mirrors: app/controllers/openid_connect/certs_controller.rb
 */

import { NextResponse } from 'next/server';
import { generateJwks } from '@/lib/oidc';

// Cache for 1 week (604800 seconds) to match Rails
const CACHE_MAX_AGE = 604800;

export async function GET() {
  const jwks = await generateJwks();

  return NextResponse.json(jwks, {
    headers: {
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
    },
  });
}
