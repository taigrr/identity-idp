import { redirect } from 'next/navigation';
import { getPersonalKeyData } from './actions';
import { PersonalKeyDisplay } from './personal-key-display';

/**
 * Personal Key Display Page
 * Mirrors: app/controllers/users/personal_keys_controller.rb
 * Route: /account/personal-key
 *
 * Shows the user their personal key after it has been regenerated
 * (e.g., after using it for 2FA or after password reset).
 */

export default async function PersonalKeyPage() {
  const data = await getPersonalKeyData();

  if (!data.personalKey) {
    redirect('/account');
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Save your personal key</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important:</strong> You used your personal key to sign in, so it has been reset.
          Save your new personal key in a secure location. You will need it if you lose access to
          your other authentication methods.
        </p>
      </div>

      <PersonalKeyDisplay
        personalKey={data.personalKey}
        generatedAt={data.generatedAt}
      />
    </div>
  );
}
