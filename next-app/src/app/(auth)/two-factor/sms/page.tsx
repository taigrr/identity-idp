/**
 * SMS/Voice OTP Verification Page
 * Mirrors: app/views/users/two_factor_authentication/otp_verification/show.html.erb
 */

'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { verifySmsCode, sendSmsCode } from '../actions';

interface OtpActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function verifyOtp(prevState: OtpActionState, formData: FormData): Promise<OtpActionState> {
  const code = formData.get('code') as string;
  const result = await verifySmsCode({ code });
  return { success: result.success, error: result.error };
}

async function resendOtp(prevState: OtpActionState, formData: FormData): Promise<OtpActionState> {
  const method = formData.get('method') as string;
  const result = await sendSmsCode({ deliveryMethod: method === 'voice' ? 'voice' : 'sms' });
  return { success: result.success, error: result.error };
}

const initialState: OtpActionState = { success: false };

function SmsVerificationContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') ?? 'sms';
  const phoneHint = searchParams.get('phone') ?? '••••••••••';

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtp,
    initialState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendOtp,
    initialState,
  );

  const methodLabel = method === 'voice' ? 'phone call' : 'text message';

  return (
    <div className="sms-verification-page">
      <h1>Enter your one-time code</h1>

      <p>
        We sent a one-time code via {methodLabel} to {phoneHint}.
      </p>

      {verifyState.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{verifyState.error}</p>
          </div>
        </div>
      )}

      {resendState.success && (
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Code resent!</p>
          </div>
        </div>
      )}

      <form action={verifyAction}>
        <input type="hidden" name="method" value={method} />

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            One-time code
          </label>
          {verifyState.fieldErrors?.code && (
            <span className="usa-error-message">{verifyState.fieldErrors.code}</span>
          )}
          <input
            className="usa-input"
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <div className="usa-checkbox">
          <input
            className="usa-checkbox__input"
            id="rememberDevice"
            name="rememberDevice"
            type="checkbox"
            value="true"
          />
          <label className="usa-checkbox__label" htmlFor="rememberDevice">
            Remember this browser for 30 days
          </label>
        </div>

        <button type="submit" className="usa-button" disabled={verifyPending}>
          {verifyPending ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <div className="alternative-actions">
        <form action={resendAction}>
          <input type="hidden" name="method" value={method} />
          <button
            type="submit"
            className="usa-button usa-button--unstyled"
            disabled={resendPending}
          >
            {resendPending ? 'Sending...' : `Resend code via ${methodLabel}`}
          </button>
        </form>

        <Link href="/two-factor" className="usa-link">
          Choose another authentication method
        </Link>
      </div>
    </div>
  );
}

export default function SmsVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SmsVerificationContent />
    </Suspense>
  );
}
