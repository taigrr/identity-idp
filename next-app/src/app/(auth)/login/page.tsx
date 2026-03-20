/**
 * Login page - Sign in form
 * Mirrors: app/views/users/sessions/new.html.erb
 */

'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <main
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>Sign in</h1>

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

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: state.fieldErrors?.password
                ? '2px solid #b91c1c'
                : '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          {state.fieldErrors?.password && (
            <p
              id="password-error"
              style={{ marginTop: '0.25rem', color: '#b91c1c', fontSize: '0.875rem' }}
            >
              {state.fieldErrors.password[0]}
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
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a
          href="/forgot-password"
          style={{ color: '#0050d8', textDecoration: 'underline' }}
        >
          Forgot your password?
        </a>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <span>Don&apos;t have an account? </span>
        <a
          href="/signup"
          style={{ color: '#0050d8', textDecoration: 'underline' }}
        >
          Create an account
        </a>
      </div>
    </main>
  );
}
