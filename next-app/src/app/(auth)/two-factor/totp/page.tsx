/**
 * TOTP Verification page
 * Mirrors: app/views/two_factor_authentication/totp_verification/show.html.erb
 */

'use client';

import { useActionState } from 'react';
import { verifyTotp, type TotpVerifyState } from './actions';

const initialState: TotpVerifyState = {};

export default function TotpVerificationPage() {
  const [state, formAction, isPending] = useActionState(verifyTotp, initialState);

  return (
    <main
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '0.5rem' }}>Enter your code</h1>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Enter the 6-digit code from your authentication app.
      </p>

      {state.error && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            color: '#b91c1c',
          }}
        >
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="code"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            One-time code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            backgroundColor: isPending ? '#9ca3af' : '#0050d8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Verifying...' : 'Submit'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a
          href="/two-factor"
          style={{ color: '#0050d8', textDecoration: 'underline' }}
        >
          Choose a different method
        </a>
      </div>
    </main>
  );
}
