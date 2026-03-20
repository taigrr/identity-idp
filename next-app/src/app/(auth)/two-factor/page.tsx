/**
 * Two-Factor Authentication Options page
 * Mirrors: app/views/two_factor_authentication/options/index.html.erb
 */

import { getAvailableMfaMethods, selectMfaMethod, type MfaMethod } from './actions';

export default async function TwoFactorPage() {
  const state = await getAvailableMfaMethods();

  return (
    <main
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '0.5rem' }}>Verify your identity</h1>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Select a method to verify it&apos;s you.
      </p>

      <form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {state.availableMethods.map((option) => (
            <button
              key={option.method}
              formAction={async () => {
                'use server';
                await selectMfaMethod(option.method as MfaMethod);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem',
              }}
            >
              <span>{option.label}</span>
              {option.configured && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  Configured
                </span>
              )}
            </button>
          ))}
        </div>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a
          href="/login"
          style={{ color: '#0050d8', textDecoration: 'underline' }}
        >
          Cancel and return to sign in
        </a>
      </div>
    </main>
  );
}
