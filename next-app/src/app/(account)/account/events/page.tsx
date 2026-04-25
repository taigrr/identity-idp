import Link from 'next/link';
import { getEventsData } from './actions';

/**
 * Device Events Page
 * Mirrors: app/controllers/events_controller.rb
 * Route: /account/events
 */

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const data = await getEventsData(page);

  const getEventLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      sign_in_after_2fa: 'Signed in',
      sign_in_before_2fa: 'Started sign in',
      phone_added: 'Phone added',
      phone_removed: 'Phone removed',
      email_added: 'Email added',
      email_deleted: 'Email removed',
      authenticator_enabled: 'Authentication app added',
      authenticator_disabled: 'Authentication app removed',
      webauthn_key_added: 'Security key added',
      webauthn_key_removed: 'Security key removed',
      personal_key_used: 'Personal key used',
      personal_key_regenerated: 'Personal key regenerated',
      password_changed: 'Password changed',
      account_verified: 'Identity verified',
      sp_user_consent_granted: 'Connected to service',
    };
    return labels[eventType] || eventType.replace(/_/g, ' ');
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Account activity</h1>
      <p className="text-gray-600 mb-6">
        Recent security events on your account. If you see any activity you don&apos;t recognize,
        please change your password immediately.
      </p>

      {data.events.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">{getEventLabel(event.eventType)}</span>
                <span className="text-sm text-gray-500">{formatDate(event.occurredAt)}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{event.deviceName}</p>
                <p className="text-xs text-gray-500">IP: {event.ipAddress}</p>
              </div>
              {event.disavowToken && (
                <div className="mt-2">
                  <Link
                    href={`/account/events/${event.id}/disavow?token=${event.disavowToken}`}
                    className="text-red-600 hover:underline text-sm"
                  >
                    This wasn&apos;t me
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {data.currentPage > 1 && (
            <Link
              href={`/account/events?page=${data.currentPage - 1}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2">
            Page {data.currentPage} of {data.totalPages}
          </span>
          {data.currentPage < data.totalPages && (
            <Link
              href={`/account/events?page=${data.currentPage + 1}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <Link href="/account" className="text-blue-600 hover:underline">
          ← Back to account
        </Link>
      </div>
    </div>
  );
}
