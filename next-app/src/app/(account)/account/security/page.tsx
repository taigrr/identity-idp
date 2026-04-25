import Link from 'next/link';
import { getMfaSettingsData } from './actions';

/**
 * Two-Factor Authentication Settings Page
 * Mirrors: app/controllers/accounts/two_factor_authentication_controller.rb
 * Route: /account/security
 */

export default async function SecuritySettingsPage() {
  const data = await getMfaSettingsData();

  const getMfaTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      phone: 'Phone',
      totp: 'Authentication app',
      webauthn: 'Security key',
      webauthn_platform: 'Face or touch unlock',
      piv_cac: 'PIV/CAC',
      backup_codes: 'Backup codes',
      personal_key: 'Personal key',
    };
    return labels[type] || type;
  };

  const getMfaTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      phone: '📱',
      totp: '🔐',
      webauthn: '🔑',
      webauthn_platform: '👆',
      piv_cac: '💳',
    };
    return icons[type] || '🔒';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Your authentication methods</h1>
      <p className="text-gray-600 mb-6">
        Manage the ways you verify your identity when signing in.
      </p>

      <div className="space-y-4 mb-8">
        {data.configurations.map((config) => (
          <div key={config.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getMfaTypeIcon(config.type)}</span>
              <div>
                <p className="font-medium">{getMfaTypeLabel(config.type)}</p>
                <p className="text-sm text-gray-600">
                  {config.name || config.phone}
                </p>
                {config.lastUsedAt && (
                  <p className="text-xs text-gray-500">
                    Last used: {config.lastUsedAt}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/account/security/${config.type}/${config.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              Manage
            </Link>
          </div>
        ))}
      </div>

      <div className="border-t pt-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Add authentication method</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/account/phone/add"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <span className="text-2xl block mb-2">📱</span>
            <span className="font-medium">Phone</span>
          </Link>
          <Link
            href="/account/totp/add"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <span className="text-2xl block mb-2">🔐</span>
            <span className="font-medium">Auth app</span>
          </Link>
          <Link
            href="/account/webauthn/add"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <span className="text-2xl block mb-2">🔑</span>
            <span className="font-medium">Security key</span>
          </Link>
          <Link
            href="/account/piv-cac/add"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <span className="text-2xl block mb-2">💳</span>
            <span className="font-medium">PIV/CAC</span>
          </Link>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Recovery options</h2>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Backup codes</p>
              {data.backupCodes.hasBackupCodes ? (
                <p className="text-sm text-gray-600">
                  {data.backupCodes.totalCount - data.backupCodes.usedCount} of{' '}
                  {data.backupCodes.totalCount} codes remaining
                </p>
              ) : (
                <p className="text-sm text-yellow-600">Not set up</p>
              )}
            </div>
            <Link
              href={data.backupCodes.hasBackupCodes ? '/account/backup-codes/regenerate' : '/account/backup-codes/create'}
              className="text-blue-600 hover:underline text-sm"
            >
              {data.backupCodes.hasBackupCodes ? 'Regenerate' : 'Set up'}
            </Link>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Personal key</p>
              <p className="text-sm text-gray-600">
                {data.hasPersonalKey ? 'Configured' : 'Not configured'}
              </p>
            </div>
            <Link
              href="/account/personal-key/regenerate"
              className="text-blue-600 hover:underline text-sm"
            >
              Regenerate
            </Link>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Forget all browsers</p>
              <p className="text-sm text-gray-600">
                Clear &quot;remember this device&quot; on all browsers
              </p>
            </div>
            <Link
              href="/account/forget-browsers"
              className="text-blue-600 hover:underline text-sm"
            >
              Clear
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
