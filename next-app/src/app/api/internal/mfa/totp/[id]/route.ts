import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal Auth App (TOTP) Management API
 * Mirrors: app/controllers/api/internal/two_factor_authentication/auth_app_controller.rb
 * Route: PUT/DELETE /api/internal/mfa/totp/[id]
 */

interface TotpConfig {
  id: string;
  name: string;
  createdAt: string;
}

// TODO: Replace with actual implementations
async function getTotpConfig(userId: string, configId: string): Promise<TotpConfig | null> {
  console.log('Getting TOTP config:', { userId, configId });
  return { id: configId, name: 'Google Authenticator', createdAt: '2024-01-15' };
}

async function updateTotpConfig(userId: string, configId: string, name: string): Promise<TotpConfig | null> {
  console.log('Updating TOTP config:', { userId, configId, name });
  return { id: configId, name, createdAt: '2024-01-15' };
}

async function deleteTotpConfig(userId: string, configId: string): Promise<boolean> {
  console.log('Deleting TOTP config:', { userId, configId });
  return true;
}

async function getUserFromSession(sessionId: string): Promise<{ userId: string } | null> {
  // TODO: Get user from session
  return { userId: 'user-123' };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = request.cookies.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const config = await updateTotpConfig(user.userId, id, name.trim());
  if (!config) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = request.cookies.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await deleteTotpConfig(user.userId, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
