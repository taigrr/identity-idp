'use client';

/**
 * Sign Out Confirmation Page
 * /sign-out/confirm
 * Confirms sign out when initiated by a service provider
 * Mirrors: OpenidConnect::LogoutController confirm_logout view
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignOutConfirmContent() {
  const searchParams = useSearchParams();
  const spName = searchParams.get('sp_name') || 'the service';
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const clientId = searchParams.get('client_id');

  const handleSignOut = async () => {
    // Call the logout API
    const url = new URL('/api/openid-connect/logout', window.location.origin);
    if (clientId) url.searchParams.set('client_id', clientId);
    if (redirectUri) url.searchParams.set('post_logout_redirect_uri', redirectUri);
    if (state) url.searchParams.set('state', state);

    const response = await fetch(url.toString(), { method: 'DELETE' });

    if (response.redirected) {
      window.location.href = response.url;
    } else {
      window.location.href = '/';
    }
  };

  const handleCancel = () => {
    // Go back or to account
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/account';
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Sign out of Login.gov?</h1>

      <p className="text-gray-600 mb-6">
        {spName} has requested that you sign out.
        This will sign you out of Login.gov and {spName}.
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Yes, sign out
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Signing out will end your session with Login.gov.
        You may need to sign in again to access {spName} or other services.
      </p>
    </div>
  );
}

export default function SignOutConfirmPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <SignOutConfirmContent />
    </Suspense>
  );
}
