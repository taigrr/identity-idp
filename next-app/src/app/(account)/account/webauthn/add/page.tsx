/**
 * WebAuthn Setup Page
 * Mirrors: app/controllers/users/webauthn_setup_controller.rb
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getWebauthnSetupOptions,
  verifyWebauthnSetup,
  type WebauthnSetupOptions,
} from './actions';

export default function WebauthnSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPlatform = searchParams.get('platform') === 'true';

  const [options, setOptions] = useState<WebauthnSetupOptions | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    async function initSetup() {
      const result = await getWebauthnSetupOptions(isPlatform);
      if (result.success && result.options) {
        setOptions(result.options);
      } else {
        setError(result.error || 'Failed to initialize WebAuthn setup');
      }
      setIsLoading(false);
    }
    initSetup();
  }, [isPlatform]);

  const handleRegister = useCallback(async () => {
    if (!options) return;

    setError(null);
    setIsRegistering(true);

    try {
      // Convert challenge from array to ArrayBuffer
      const challengeBuffer = new Uint8Array(options.challenge).buffer;

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: {
          name: options.rpName,
          id: options.rpId,
        },
        user: {
          id: Uint8Array.from(options.userId, (c) => c.charCodeAt(0)),
          name: options.userName,
          displayName: options.userDisplayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: isPlatform ? 'platform' : 'cross-platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        attestation: 'direct',
        excludeCredentials: options.excludeCredentials.map((id) => ({
          type: 'public-key' as const,
          id: Uint8Array.from(atob(id), (c) => c.charCodeAt(0)),
        })),
      };

      // Create credential using WebAuthn API
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        setError('Failed to create credential');
        return;
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Convert ArrayBuffers to base64
      const attestationObject = btoa(
        String.fromCharCode(...new Uint8Array(response.attestationObject))
      );
      const clientDataJSON = btoa(
        String.fromCharCode(...new Uint8Array(response.clientDataJSON))
      );

      // Get transports if available
      const transports = response.getTransports ? response.getTransports() : [];

      // Send to server for verification
      const result = await verifyWebauthnSetup({
        attestationObject,
        clientDataJSON,
        name: name.trim() || (isPlatform ? 'Face/Touch unlock' : 'Security key'),
        transports,
        platformAuthenticator: isPlatform,
      });

      if (result.success) {
        router.push('/account?mfa=webauthn_added');
      } else {
        setError(result.error || 'Failed to register credential');
      }
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Registration was cancelled or timed out. Please try again.');
        } else if (err.name === 'SecurityError') {
          setError('This security key is not supported on this site.');
        } else {
          setError(`Registration failed: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsRegistering(false);
    }
  }, [options, isPlatform, name, router]);

  if (isLoading) {
    return (
      <div className="webauthn-setup">
        <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up security key'}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="webauthn-setup">
        <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up security key'}</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error || 'Failed to initialize setup'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="webauthn-setup">
      <h1>{isPlatform ? 'Set up face or touch unlock' : 'Set up security key'}</h1>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            {isPlatform
              ? 'Use your device\'s built-in fingerprint reader or facial recognition to sign in securely.'
              : 'Use a physical security key (like YubiKey) to sign in securely.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="usa-form-group margin-bottom-4">
        <label className="usa-label" htmlFor="name">
          Nickname (optional)
        </label>
        <span className="usa-hint">
          Give this {isPlatform ? 'device' : 'security key'} a name to help you identify it
        </span>
        <input
          className="usa-input"
          id="name"
          name="name"
          type="text"
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="usa-button"
        onClick={handleRegister}
        disabled={isRegistering}
      >
        {isRegistering
          ? 'Registering...'
          : isPlatform
            ? 'Register face or touch unlock'
            : 'Register security key'}
      </button>

      {!isPlatform && (
        <div className="margin-top-4">
          <p className="text-base">
            Make sure your security key is plugged in and ready before clicking the button above.
          </p>
        </div>
      )}
    </div>
  );
}
