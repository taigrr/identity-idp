import { getEmailLanguageData } from './actions';
import { EmailLanguageForm } from './email-language-form';

/**
 * Email Language Page
 * Mirrors: app/controllers/users/email_language_controller.rb
 * Route: /account/email-language
 */

export default async function EmailLanguagePage() {
  const data = await getEmailLanguageData();

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Email language preference</h1>
      <p className="text-gray-600 mb-6">
        Choose the language for emails from Login.gov, including security alerts
        and verification codes.
      </p>

      <EmailLanguageForm
        currentLanguage={data.currentLanguage}
        languages={data.languages}
      />
    </div>
  );
}
