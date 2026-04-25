/**
 * Analytics logger - JSON file logging like Ahoy
 * @see config/initializers/ahoy.rb
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { analyticsConfig } from './config';
import type { LoggedEvent } from './types';

let logPath: string | null = null;

function ensureLogDirectory(): string {
  if (logPath) return logPath;

  const { logDirectory, logFilename, logToStdout } = analyticsConfig;

  if (logToStdout) {
    logPath = 'stdout';
    return logPath;
  }

  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory, { recursive: true });
  }

  logPath = join(logDirectory, logFilename);
  return logPath;
}

export function logEvent(event: LoggedEvent): void {
  const path = ensureLogDirectory();
  const json = JSON.stringify(event);

  if (path === 'stdout') {
    console.log(json);
  } else {
    appendFileSync(path, json + '\n');
  }
}

export function isValidUuid(token: string | undefined | null): boolean {
  if (!token) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

export function shouldExcludeEvent(visitorToken?: string, visitToken?: string): boolean {
  if (process.env.ENABLE_LOAD_TESTING_MODE === 'true') return false;
  if (process.env.USE_DASHBOARD_SERVICE_PROVIDERS === 'true') return false;
  return !isValidUuid(visitorToken) || !isValidUuid(visitToken);
}
