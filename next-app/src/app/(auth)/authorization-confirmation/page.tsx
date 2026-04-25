/**
 * Authorization Confirmation Page
 * /authorization-confirmation
 * First-time consent screen when connecting to a service provider
 * Mirrors: app/controllers/users/authorization_confirmation_controller.rb
 */

import { continueToSp, cancelAndSignOut } from './actions';

// TODO: Get this data from session/database
interface PageData {
  serviceProvider: {
    name: string;
    logoUrl?: string;
  };
  userEmail: string;
  requestedScopes: string[];
}

function getPageData(): PageData {
  return {
    serviceProvider: {
      name: 'Example Service',
      logoUrl: undefined,
    },
    userEmail: 'user@example.com',
    requestedScopes: ['email', 'profile'],
  };
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Verify your identity',
  email: 'Your email address',
  profile: 'Your name and other profile information',
  address: 'Your mailing address',
  phone: 'Your phone number',
  social_security_number: 'Your Social Security number',
};

export default function AuthorizationConfirmationPage() {
  const { serviceProvider, userEmail, requestedScopes } = getPageData();

  return (
    <div className="max-w-lg mx-auto">
      {/* Service Provider Info */}
      <div className="text-center mb-8">
        {serviceProvider.logoUrl ? (
          <img
            src={serviceProvider.logoUrl}
            alt={serviceProvider.name}
            className="h-16 mx-auto mb-4"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-gray-400">
              {serviceProvider.name.charAt(0)}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">Sign in to {serviceProvider.name}</h1>
        <p className="text-gray-600">
          {serviceProvider.name} wants to access your Login.gov account
        </p>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-500">Signing in as</p>
        <p className="font-medium">{userEmail}</p>
      </div>

      {/* Requested Information */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">This service will receive:</h2>
        <ul className="space-y-2">
          {requestedScopes
            .filter((scope) => SCOPE_DESCRIPTIONS[scope])
            .map((scope) => (
              <li key={scope} className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {SCOPE_DESCRIPTIONS[scope]}
              </li>
            ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <form action={continueToSp}>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to {serviceProvider.name}
          </button>
        </form>

        <form action={cancelAndSignOut}>
          <button
            type="submit"
            className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel and sign out
          </button>
        </form>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-gray-500 text-center mt-6">
        By continuing, you agree to share the information above with {serviceProvider.name}.
        This does not give {serviceProvider.name} access to any other Login.gov information.
      </p>
    </div>
  );
}
