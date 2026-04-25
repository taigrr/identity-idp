import { redirect } from 'next/navigation';
import { getSelectEmailData, selectEmail } from './actions';
import { SelectEmailForm } from './select-email-form';

/**
 * Select Email Page
 * Mirrors: app/controllers/sign_up/select_email_controller.rb
 * Route: /signup/select-email
 *
 * Allows user to select which email to share with service provider
 * when they have multiple verified emails.
 */

export default async function SelectEmailPage() {
  const data = await getSelectEmailData();

  if (!data.needsCompletionScreen) {
    redirect('/account');
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Select an email to share</h1>

      <p className="text-gray-600 mb-6">
        Choose which email address you want to share with{' '}
        <strong>{data.spName}</strong>.
      </p>

      <SelectEmailForm
        userEmails={data.userEmails}
        selectedEmailId={data.selectedEmailId}
        canAddEmail={data.canAddEmail}
        selectEmail={selectEmail}
      />
    </div>
  );
}
