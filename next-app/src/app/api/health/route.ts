/**
 * Main Health Check Endpoint
 * GET /api/health
 * Mirrors: app/controllers/health/health_controller.rb
 *
 * Checks database connectivity and returns multi-check response format.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { MultiHealthChecker, createDatabaseChecker } from '@/lib/health';

export async function GET() {
  const checker = new MultiHealthChecker({
    database: createDatabaseChecker(db),
  });

  const result = await checker.check();
  const status = result.healthy ? 200 : 500;

  return NextResponse.json(result, { status });
}
