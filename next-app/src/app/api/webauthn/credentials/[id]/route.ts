/**
 * WebAuthn Credential Management Endpoint
 * PUT/DELETE /api/webauthn/credentials/[id]
 * Rename or delete a WebAuthn credential
 * 
 * Mirrors: Api::Internal::TwoFactorAuthentication::WebauthnController
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { WebAuthnCredential } from '@/lib/mfa/webauthn';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
}

interface UpdateRequest {
  name: string;
}

// TODO: Replace with actual session/db lookups
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function getWebAuthnCredential(
  credentialId: string,
  userId: string,
): Promise<WebAuthnCredential | null> {
  console.log('Getting WebAuthn credential:', credentialId, 'for user:', userId);
  // TODO: Replace with actual database lookup
  return null;
}

async function updateWebAuthnCredential(
  credentialId: string,
  name: string,
): Promise<boolean> {
  console.log('Updating WebAuthn credential:', credentialId, 'with name:', name);
  // TODO: Replace with actual database update
  return true;
}

async function deleteWebAuthnCredential(credentialId: string): Promise<boolean> {
  console.log('Deleting WebAuthn credential:', credentialId);
  // TODO: Replace with actual database delete
  return true;
}

async function countUserMfaMethods(userId: string): Promise<number> {
  console.log('Counting MFA methods for user:', userId);
  // TODO: Replace with actual count
  // MfaContext.new(user).enabled_mfa_methods_count
  return 2;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT - Update credential name
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { id } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  // Get the credential and verify ownership
  const credential = await getWebAuthnCredential(id, session.userId);
  if (!credential) {
    return NextResponse.json(
      { error: 'Credential not found' },
      { status: 404 },
    );
  }

  // Parse request body
  let body: UpdateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 },
    );
  }

  // Update the credential name
  const success = await updateWebAuthnCredential(id, body.name.trim());

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    id,
    name: body.name.trim(),
  });
}

/**
 * DELETE - Remove a credential
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { id } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  // Get the credential and verify ownership
  const credential = await getWebAuthnCredential(id, session.userId);
  if (!credential) {
    return NextResponse.json(
      { error: 'Credential not found' },
      { status: 404 },
    );
  }

  // Check if user will still have MFA methods after deletion
  const mfaCount = await countUserMfaMethods(session.userId);
  if (mfaCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete your last MFA method' },
      { status: 400 },
    );
  }

  // Delete the credential
  const success = await deleteWebAuthnCredential(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    id,
  });
}
