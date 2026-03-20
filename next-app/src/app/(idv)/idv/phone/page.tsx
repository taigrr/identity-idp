/**
 * IDV Phone Verification Page
 * Mirrors: app/controllers/idv/phone_controller.rb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitPhone, requestGpoLetter } from '../actions';

export default function IdvPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'voice'>('sms');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('phone', phone);
      formData.set('delivery_method', deliveryMethod);
      
      const result = await submitPhone(formData);
      
      if (result.success) {
        router.push('/idv/phone/verify');
      } else {
        setError(result.error || 'Phone verification failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyByMail() {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await requestGpoLetter();
      
      if (result.success) {
        router.push('/idv/letter-enqueued');
      } else {
        setError(result.error || 'Failed to request letter');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="idv-phone">
      <h1>Verify your phone number</h1>

      <p className="usa-intro margin-bottom-4">
        We&apos;ll verify that a phone number is associated with you. This helps protect your
        identity.
      </p>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="phone">
            Phone number
          </label>
          <span className="usa-hint">
            Enter a U.S. phone number that is associated with you
          </span>
          <input
            className="usa-input usa-input--medium"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <fieldset className="usa-fieldset margin-top-3">
          <legend className="usa-legend">How should we contact you?</legend>

          <div className="usa-radio">
            <input
              className="usa-radio__input"
              id="delivery-sms"
              type="radio"
              name="delivery_method"
              value="sms"
              checked={deliveryMethod === 'sms'}
              onChange={() => setDeliveryMethod('sms')}
            />
            <label className="usa-radio__label" htmlFor="delivery-sms">
              Text message (SMS)
            </label>
          </div>

          <div className="usa-radio">
            <input
              className="usa-radio__input"
              id="delivery-voice"
              type="radio"
              name="delivery_method"
              value="voice"
              checked={deliveryMethod === 'voice'}
              onChange={() => setDeliveryMethod('voice')}
            />
            <label className="usa-radio__label" htmlFor="delivery-voice">
              Phone call
            </label>
          </div>
        </fieldset>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending code...' : 'Send verification code'}
          </button>
        </div>
      </form>

      <div className="margin-top-6 padding-top-4 border-top-1px border-base-lighter">
        <h2>Can&apos;t verify by phone?</h2>
        <p>
          If you can&apos;t verify your phone number, we can mail you a verification code. This
          takes 5-10 business days.
        </p>
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={handleVerifyByMail}
          disabled={isSubmitting}
        >
          Verify by mail instead
        </button>
      </div>

      <div className="margin-top-4">
        <Link href="/idv/verify-info" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}
