/**
 * Analytics configuration - mirrors Ahoy config
 * @see config/initializers/ahoy.rb
 */

export interface AnalyticsConfig {
  logFilename: string;
  logToStdout: boolean;
  logDirectory: string;
  visitDurationSeconds: number;
  trackBots: boolean;
  gitSha?: string;
  gitBranch?: string;
}

function getConfig(): AnalyticsConfig {
  return {
    logFilename: process.env.ANALYTICS_LOG_FILENAME || 'events.log',
    logToStdout: process.env.LOG_TO_STDOUT === 'true',
    logDirectory: process.env.ANALYTICS_LOG_DIR || './log',
    visitDurationSeconds: parseInt(process.env.SESSION_TIMEOUT_SECONDS || '900', 10),
    trackBots: process.env.ANALYTICS_TRACK_BOTS !== 'false',
    gitSha: process.env.GIT_SHA,
    gitBranch: process.env.GIT_BRANCH,
  };
}

export const analyticsConfig = getConfig();
