'use client';

/**
 * Backup Code Reminder Page
 * Mirrors: app/controllers/users/backup_code_reminder_controller.rb
 * Route: /account/backup-code-reminder
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BackupCodeReminderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCodes = () => {
    setIsSubmitting(true);
    router.push('/account/backup-codes/create');
  };

  const handleSkip = () => {
    setIsSubmitting(true);
    router.push('/account');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Create backup codes</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important:</strong> Backup codes help you sign in if you lose access
          to your other authentication methods.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        Backup codes are one-time use codes that you can use to sign in if you can&apos;t
        use your phone or authentication app. We recommend saving them in a secure location.
      </p>

      <div className="bg-gray-50 rounded p-4 mb-6">
        <h2 className="font-medium mb-2">How backup codes work:</h2>
        <ul className="text-gray-700 text-sm space-y-2">
          <li>• You&apos;ll receive 10 backup codes</li>
          <li>• Each code can only be used once</li>
          <li>• Save them somewhere safe (password manager, printed, etc.)</li>
          <li>• Generate new codes anytime from your account</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCreateCodes}
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Create backup codes
        </button>

        <button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="w-full py-3 px-4 border border-gray-300 rounded hover:bg-gray-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
