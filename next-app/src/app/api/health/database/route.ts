/**
 * Database Health Check Endpoint
 * GET /api/health/database
 * Mirrors: app/controllers/health/database_controller.rb
 *
 * Checks only database connectivity with simple response format.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { checkDatabaseHealth } from '@/lib/health';

export async function GET() {
  const result = await checkDatabaseHealth(db);
  const status = result.healthy ? 200 : 500;

  return NextResponse.json(result, { status });
}
