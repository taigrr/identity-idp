/**
 * Backup Code Verification Page
 * Mirrors: app/views/two_factor_authentication/backup_code_verification/show.html.erb
 */

'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { verifyBackupCode } from '../actions';

interface BackupCodeActionState {
  success: boolean;
  error?: string;
}

async function verifyBackupCodeAction(
  prevState: BackupCodeActionState,
  formData: FormData
): Promise<BackupCodeActionState> {
  const code = formData.get('code') as string;
  const result = await verifyBackupCode({ code });
  return { success: result.success, error: result.error };
}

const initialState: BackupCodeActionState = { success: false };

export default function BackupCodeVerificationPage() {
  const [state, formAction, pending] = useActionState(verifyBackupCodeAction, initialState);

  return (
    <div className="backup-code-verification-page">
      <h1>Enter a backup code</h1>

      <p>
        Enter one of your backup codes. Each code can only be used once.
      </p>

      {state.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            Backup code
          </label>
          <span className="usa-hint">12 characters, xxxx-xxxx-xxxx format</span>
          <input
            className="usa-input"
            id="code"
            name="code"
            type="text"
            maxLength={14}
            required
            autoComplete="off"
            autoFocus
            placeholder="xxxx-xxxx-xxxx"
          />
        </div>

        <button type="submit" className="usa-button" disabled={pending}>
          {pending ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <div className="alternative-actions">
        <p>
          <strong>Don&apos;t have your backup codes?</strong>
        </p>
        <Link href="/two-factor" className="usa-link">
          Choose another authentication method
        </Link>
      </div>
    </div>
  );
}
