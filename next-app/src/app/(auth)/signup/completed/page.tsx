import { redirect } from 'next/navigation';
import { getCompletionData, submitCompletion } from './actions';
import { CompletionForm } from './completion-form';

/**
 * Sign Up Completion Page
 * Mirrors: app/controllers/sign_up/completions_controller.rb
 * Route: /signup/completed
 *
 * Shows user consent screen before redirecting to service provider.
 * Displays requested attributes and allows email selection.
 */

export default async function SignUpCompletedPage() {
  const data = await getCompletionData();

  if (!data.needsCompletionScreen) {
    redirect('/account');
  }

  const { serviceProvider, userEmails, selectedEmailId, requestedAttributes, identityVerified } =
    data;

  if (!serviceProvider) {
    redirect('/account');
  }

  const attributeLabels: Record<string, string> = {
    email: 'Email address',
    given_name: 'First name',
    family_name: 'Last name',
    birthdate: 'Date of birth',
    social_security_number: 'Social Security number',
    address: 'Address',
    phone: 'Phone number',
    verified_at: 'Identity verification date',
    all_emails: 'All email addresses',
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">You&apos;ve successfully signed in</h1>

      {serviceProvider.logoUrl && (
        <img
          src={serviceProvider.logoUrl}
          alt={serviceProvider.friendlyName}
          className="h-12 mb-4"
        />
      )}

      <p className="text-gray-600 mb-6">
        <strong>{serviceProvider.friendlyName}</strong> is asking for access to your Login.gov
        account.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Information to be shared:</h2>
        <ul className="space-y-2">
          {requestedAttributes.map((attr) => (
            <li key={attr} className="flex items-center text-gray-700">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {attributeLabels[attr] || attr}
            </li>
          ))}
        </ul>

        {identityVerified && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <svg
                className="w-4 h-4 inline mr-1 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Your identity has been verified
            </p>
          </div>
        )}
      </div>

      <CompletionForm
        userEmails={userEmails}
        selectedEmailId={selectedEmailId}
        submitCompletion={submitCompletion}
        spName={serviceProvider.friendlyName}
      />
    </div>
  );
}
