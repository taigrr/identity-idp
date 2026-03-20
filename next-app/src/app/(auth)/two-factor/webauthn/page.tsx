/**
 * WebAuthn Verification Page
 * Mirrors: app/views/two_factor_authentication/webauthn_verification/show.html.erb
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

interface WebAuthnOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: 'public-key';
    id: string;
  }>;
  userVerification: 'preferred' | 'required' | 'discouraged';
}

function WebauthnVerificationContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') === 'true';

  const [status, setStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startAuthentication = async () => {
    setStatus('authenticating');
    setError(null);

    try {
      // Fetch authentication options from server
      const optionsResponse = await fetch('/api/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }

      const options: WebAuthnOptions = await optionsResponse.json();

      // Convert base64 challenge to ArrayBuffer
      const challenge = Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0));

      // Convert credential IDs
      const allowCredentials = options.allowCredentials.map((cred) => ({
        type: cred.type,
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
      }));

      // Start WebAuthn authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: options.timeout,
          rpId: options.rpId,
          allowCredentials,
          userVerification: options.userVerification,
        },
      });

      if (!credential) {
        throw new Error('No credential returned');
      }

      // Submit to server for verification
      const verifyResponse = await fetch('/api/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: btoa(
            String.fromCharCode(...new Uint8Array((credential as PublicKeyCredential).rawId)),
          ),
          response: {
            authenticatorData: btoa(
              String.fromCharCode(
                ...new Uint8Array(
                  ((credential as PublicKeyCredential).response as AuthenticatorAssertionResponse)
                    .authenticatorData,
                ),
              ),
            ),
            clientDataJSON: btoa(
              String.fromCharCode(
                ...new Uint8Array((credential as PublicKeyCredential).response.clientDataJSON),
              ),
            ),
            signature: btoa(
              String.fromCharCode(
                ...new Uint8Array(
                  ((credential as PublicKeyCredential).response as AuthenticatorAssertionResponse)
                    .signature,
                ),
              ),
            ),
          },
          type: credential.type,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      setStatus('success');

      // Redirect on success
      const { redirectUrl } = await verifyResponse.json();
      window.location.href = redirectUrl || '/';
    } catch (err) {
      console.error('WebAuthn error:', err);
      setStatus('error');
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Authentication was cancelled or not allowed');
        } else if (err.name === 'NotSupportedError') {
          setError('Your browser does not support this authentication method');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // Auto-start on component mount
  useEffect(() => {
    // Small delay to let the page render
    const timer = setTimeout(() => {
      startAuthentication();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="webauthn-verification-page">
      <h1>{platform ? 'Use face or touch unlock' : 'Use your security key'}</h1>

      {status === 'authenticating' && (
        <div className="authenticating">
          <p>
            {platform
              ? 'Follow the prompts from your browser to use Face ID, Touch ID, Windows Hello, or another method.'
              : 'Insert your security key and press the button when it lights up.'}
          </p>
          <div className="spinner" aria-label="Authenticating..." />
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="usa-alert usa-alert--error">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
          <button
            onClick={startAuthentication}
            className="usa-button"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Authentication successful! Redirecting...</p>
          </div>
        </div>
      )}

      <div className="alternative-actions">
        <Link href="/two-factor" className="usa-link">
          Choose another authentication method
        </Link>
      </div>
    </div>
  );
}

export default function WebauthnVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WebauthnVerificationContent />
    </Suspense>
  );
}
