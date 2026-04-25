'use client';

/**
 * Rules of Use Page
 * /rules-of-use
 * User must accept rules of use before continuing
 * Mirrors: app/controllers/users/rules_of_use_controller.rb
 */

import { useState, useActionState } from 'react';
import { submitRulesOfUse } from './actions';

const initialState = {
  error: undefined,
};

// Rules of use content - in production this would come from CMS/translations
const RULES_CONTENT = `
## Rules of Use for Login.gov

By using Login.gov, you agree to the following:

### 1. Identity Verification
You will only use Login.gov to verify your own identity. Attempting to verify someone else's identity is prohibited and may result in legal action.

### 2. Accurate Information
You will provide accurate and truthful information when creating your account and verifying your identity.

### 3. Account Security
You are responsible for keeping your account secure. This includes:
- Using a strong, unique password
- Setting up multi-factor authentication
- Not sharing your login credentials with others
- Reporting any unauthorized access immediately

### 4. Prohibited Uses
You may not use Login.gov to:
- Engage in any illegal activity
- Impersonate another person
- Access accounts or information that does not belong to you
- Interfere with or disrupt the service

### 5. Privacy
Login.gov collects and uses your information in accordance with our Privacy Policy. Your information is protected by federal privacy laws.

### 6. Account Termination
Login.gov reserves the right to suspend or terminate accounts that violate these rules.

### 7. Changes to Rules
These rules may be updated from time to time. Continued use of Login.gov constitutes acceptance of any changes.
`;

export default function RulesOfUsePage() {
  const [state, formAction, isPending] = useActionState(submitRulesOfUse, initialState);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rules of Use</h1>

      <p className="text-gray-600 mb-6">
        Please read and accept the rules of use before continuing.
      </p>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* Rules Content */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto prose prose-sm">
        <div
          dangerouslySetInnerHTML={{
            __html: RULES_CONTENT
              .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
              .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1">$1</h3>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/\n\n/g, '</p><p class="mb-3">')
          }}
        />
      </div>

      <form action={formAction} className="space-y-6">
        {/* Checkbox */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms_accepted"
            name="terms_accepted"
            value="true"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms_accepted" className="ml-3 text-sm text-gray-700">
            I have read and agree to the Login.gov Rules of Use
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || !termsAccepted}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Submitting...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
