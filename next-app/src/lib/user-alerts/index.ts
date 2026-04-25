/**
 * User Alerts Module - Notifications to users about account events
 * Mirrors: app/services/user_alerts/*.rb
 */

// Types
export * from './types';

// Alerts
export {
  alertUserAboutPasswordChange,
  alertUserAboutAccountVerified,
  alertUserAboutAccountRejected,
  alertUserAboutPersonalKeySignIn,
  scheduleNewDeviceAlert,
  sendNewDeviceAlert,
  type AlertDependencies,
} from './alerts';
