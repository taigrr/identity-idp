/**
 * Add Phone Number Page
 * Mirrors: app/controllers/users/phone_setup_controller.rb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPhone } from './actions';

export default function AddPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [internationalCode, setInternationalCode] = useState('+1');
  const [deliveryPreference, setDeliveryPreference] = useState<'sms' | 'voice'>('sms');
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await addPhone({
        phone: phone.replace(/\D/g, ''),
        internationalCode,
        deliveryPreference,
        makeDefault,
      });

      if (result.success) {
        // Redirect to OTP verification
        router.push('/account/phone/verify');
      } else {
        setError(result.error || 'Failed to add phone');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="phone-setup">
      <h1>Add phone number</h1>

      <p className="usa-intro">
        Add a phone number for two-factor authentication. We&apos;ll send you a one-time code to
        verify your phone.
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="international_code">
            Country code
          </label>
          <select
            className="usa-select"
            id="international_code"
            name="international_code"
            value={internationalCode}
            onChange={(e) => setInternationalCode(e.target.value)}
          >
            <option value="+1">United States (+1)</option>
            <option value="+1">Canada (+1)</option>
            <option value="+44">United Kingdom (+44)</option>
            <option value="+49">Germany (+49)</option>
            <option value="+33">France (+33)</option>
            <option value="+81">Japan (+81)</option>
            <option value="+86">China (+86)</option>
            <option value="+91">India (+91)</option>
            <option value="+52">Mexico (+52)</option>
          </select>
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="phone">
            Phone number
          </label>
          <input
            className="usa-input usa-input--medium"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
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
              name="delivery_preference"
              value="sms"
              checked={deliveryPreference === 'sms'}
              onChange={() => setDeliveryPreference('sms')}
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
              name="delivery_preference"
              value="voice"
              checked={deliveryPreference === 'voice'}
              onChange={() => setDeliveryPreference('voice')}
            />
            <label className="usa-radio__label" htmlFor="delivery-voice">
              Phone call
            </label>
          </div>
        </fieldset>

        <div className="usa-checkbox margin-top-3">
          <input
            className="usa-checkbox__input"
            id="make-default"
            type="checkbox"
            name="make_default"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
          />
          <label className="usa-checkbox__label" htmlFor="make-default">
            Make this my default phone number
          </label>
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending code...' : 'Send code'}
          </button>
        </div>
      </form>

      <div className="usa-alert usa-alert--info margin-top-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Message and data rates may apply. For SMS, reply HELP for help or STOP to cancel.
          </p>
        </div>
      </div>
    </div>
  );
}
