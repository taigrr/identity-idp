/**
 * WebAuthn (Security Key / Passkey) Setup Page - Signup Flow
 * Mirrors: app/controllers/users/webauthn_setup_controller.rb
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { initWebAuthnSetup, confirmWebAuthnSetup, type WebAuthnSetupData } from './actions';

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function WebAuthnSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPlatform = searchParams.get('platform') === 'true';

  const [setupData, setSetupData] = useState<WebAuthnSetupData | null>(null);
  const [name, setName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webAuthnSupported, setWebAuthnSupported] = useState(true);

  useEffect(() => {
    // Check WebAuthn support
    if (!window.PublicKeyCredential) {
      setWebAuthnSupported(false);
      setIsLoading(false);
      return;
    }

    async function init() {
      const result = await initWebAuthnSetup({ platform: isPlatform });
      if (result.success && result.data) {
        setSetupData(result.data);
      } else {
        setError(result.error || 'Failed to initialize setup');
      }
      setIsLoading(false);
    }
    init();
  }, [isPlatform]);

  const handleSetup = useCallback(async () => {
    if (!setupData) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Create credential using WebAuthn API
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToBuffer(setupData.challenge),
        rp: {
          id: setupData.rpId,
          name: setupData.rpName,
        },
        user: {
          id: new TextEncoder().encode(setupData.userId),
          name: setupData.userName,
          displayName: setupData.userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: setupData.authenticatorSelection,
        timeout: 60000,
        attestation: 'none',
        excludeCredentials: setupData.excludeCredentials.map((id) => ({
          id: base64UrlToBuffer(id),
          type: 'public-key' as const,
        })),
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        setError('Failed to create credential');
        return;
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const transports = response.getTransports?.() || [];

      // Send to server for verification
      const result = await confirmWebAuthnSetup({
        attestationObject: bufferToBase64Url(response.attestationObject),
        clientDataJson: bufferToBase64Url(response.clientDataJSON),
        name: name.trim() || (isPlatform ? 'Face or touch unlock' : 'Security key'),
        platformAuthenticator: isPlatform,
        transports: transports.join(','),
        rememberDevice,
      });

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setError(result.error || 'Failed to set up credential');
      }
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Setup was cancelled or timed out. Please try again.');
        } else if (err.name === 'InvalidStateError') {
          setError('This authenticator is already registered to your account.');
        } else {
          setError(`Setup failed: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [setupData, name, isPlatform, rememberDevice, router]);

  if (isLoading) {
    return (
      <div className="webauthn-setup">
        <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up a security key'}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!webAuthnSupported) {
    return (
      <div className="webauthn-setup">
        <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up a security key'}</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Not supported</h2>
            <p className="usa-alert__text">
              Your browser doesn&apos;t support{' '}
              {isPlatform ? 'face or touch unlock' : 'security keys'}. Please try a different
              browser or choose another authentication method.
            </p>
          </div>
        </div>
        <Link href="/signup/mfa" className="usa-button margin-top-2">
          Choose another method
        </Link>
      </div>
    );
  }

  return (
    <div className="webauthn-setup">
      <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up a security key'}</h1>

      <p className="usa-intro">
        {isPlatform
          ? "Use your device's built-in face or fingerprint recognition to sign in securely."
          : 'Use a physical security key (like YubiKey) to sign in securely.'}
      </p>

      {!isPlatform && (
        <div className="usa-alert usa-alert--info margin-bottom-4">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Before you begin</h2>
            <p className="usa-alert__text">
              Make sure your security key is plugged in or ready to use.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="margin-bottom-4">
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="name">
            Nickname <span className="usa-hint text-base">(optional)</span>
          </label>
          <input
            className="usa-input"
            id="name"
            name="name"
            type="text"
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isPlatform ? 'Face or touch unlock' : 'Security key'}
          />
          <span className="usa-hint">
            Give this {isPlatform ? 'method' : 'security key'} a name to help you identify it
          </span>
        </div>

        <div className="usa-form-group margin-top-3">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="remember-device"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <label className="usa-checkbox__label" htmlFor="remember-device">
              Remember this browser for 30 days
            </label>
          </div>
        </div>
      </div>

      <div className="margin-top-4">
        <button
          type="button"
          className="usa-button"
          onClick={handleSetup}
          disabled={isSubmitting || !setupData}
        >
          {isSubmitting
            ? 'Setting up...'
            : isPlatform
              ? 'Set up face or touch unlock'
              : 'Set up security key'}
        </button>
        <Link href="/signup/mfa" className="usa-button usa-button--outline margin-left-2">
          Cancel
        </Link>
      </div>

      {isPlatform && (
        <p className="margin-top-4 text-base">
          When you click the button above, your browser will prompt you to use your device&apos;s
          face or fingerprint recognition.
        </p>
      )}
    </div>
  );
}
