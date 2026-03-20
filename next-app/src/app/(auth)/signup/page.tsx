/**
 * Signup page - Create account form
 * Mirrors: app/views/sign_up/registrations/new.html.erb
 */

'use client';

import { useActionState } from 'react';
import { signup, type SignupState } from './actions';

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <main
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>Create your account</h1>

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
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: state.fieldErrors?.email
                ? '2px solid #b91c1c'
                : '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          {state.fieldErrors?.email && (
            <p
              id="email-error"
              style={{ marginTop: '0.25rem', color: '#b91c1c', fontSize: '0.875rem' }}
            >
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="emailLanguage"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Email language preference
          </label>
          <select
            id="emailLanguage"
            name="emailLanguage"
            defaultValue="en"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'white',
            }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              name="termsAccepted"
              required
              style={{ marginTop: '0.25rem' }}
            />
            <span style={{ fontSize: '0.875rem' }}>
              I have read and accept the{' '}
              <a
                href="/rules-of-use"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0050d8', textDecoration: 'underline' }}
              >
                Login.gov Rules of Use
              </a>
            </span>
          </label>
          {state.fieldErrors?.termsAccepted && (
            <p style={{ marginTop: '0.25rem', color: '#b91c1c', fontSize: '0.875rem' }}>
              {state.fieldErrors.termsAccepted[0]}
            </p>
          )}
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
          {isPending ? 'Creating account...' : 'Continue'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <span>Already have an account? </span>
        <a href="/login" style={{ color: '#0050d8', textDecoration: 'underline' }}>
          Sign in
        </a>
      </div>
    </main>
  );
}
