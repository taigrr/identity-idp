/**
 * OpenID Connect Discovery Endpoint
 * /.well-known/openid-configuration
 * Mirrors: app/controllers/openid_connect/configuration_controller.rb
 */

import { NextResponse } from 'next/server';
import {
  getOidcConfig,
  VALID_AUTHN_CONTEXTS,
  GRANT_TYPES,
  RESPONSE_TYPES,
  SUBJECT_TYPES,
  ID_TOKEN_SIGNING_ALGS,
  TOKEN_ENDPOINT_AUTH_METHODS,
  CLAIMS,
  VALID_SCOPES,
} from '@/lib/oidc';

export async function GET() {
  const config = getOidcConfig();
  const issuer = config.issuer;

  const configuration = {
    // Issuer
    issuer,

    // Endpoints
    authorization_endpoint: `${issuer}/openid-connect/authorize`,
    token_endpoint: `${issuer}/api/openid-connect/token`,
    userinfo_endpoint: `${issuer}/api/openid-connect/userinfo`,
    jwks_uri: `${issuer}/api/openid-connect/certs`,
    end_session_endpoint: `${issuer}/openid-connect/logout`,

    // Supported features
    acr_values_supported: VALID_AUTHN_CONTEXTS,
    claims_supported: ['iss', 'sub', ...CLAIMS],
    grant_types_supported: GRANT_TYPES,
    response_types_supported: RESPONSE_TYPES,
    scopes_supported: VALID_SCOPES,
    subject_types_supported: SUBJECT_TYPES,

    // Crypto configuration
    id_token_signing_alg_values_supported: ID_TOKEN_SIGNING_ALGS,
    token_endpoint_auth_methods_supported: TOKEN_ENDPOINT_AUTH_METHODS,
    token_endpoint_auth_signing_alg_values_supported: ID_TOKEN_SIGNING_ALGS,

    // Documentation
    service_documentation: 'https://developers.login.gov/',
  };

  return NextResponse.json(configuration, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
