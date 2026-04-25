/**
 * Phone Setup Page - Signup Flow
 * Mirrors: app/controllers/users/phone_setup_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPhoneSetupData, submitPhoneSetup } from './actions';

const COUNTRY_CODES = [
  { code: '1', country: 'United States (+1)', abbr: 'US' },
  { code: '1', country: 'Canada (+1)', abbr: 'CA' },
  { code: '44', country: 'United Kingdom (+44)', abbr: 'GB' },
  { code: '49', country: 'Germany (+49)', abbr: 'DE' },
  { code: '33', country: 'France (+33)', abbr: 'FR' },
  { code: '81', country: 'Japan (+81)', abbr: 'JP' },
  { code: '82', country: 'South Korea (+82)', abbr: 'KR' },
  { code: '61', country: 'Australia (+61)', abbr: 'AU' },
];

export default function PhoneSetupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('1');
  const [deliveryPreference, setDeliveryPreference] = useState<'sms' | 'voice'>('sms');
  const [makeDefault, setMakeDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorOutage, setVendorOutage] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await getPhoneSetupData();
      if (result.success && result.data) {
        if (result.data.vendorOutage) {
          setVendorOutage(true);
        }
        if (result.data.maxPhonesReached) {
          router.push('/account?error=max_phones');
          return;
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitPhoneSetup({
        phone,
        internationalCode: countryCode,
        otpDeliveryPreference: deliveryPreference,
        makeDefault,
      });

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setError(result.error || 'Failed to set up phone');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="phone-setup">
        <h1>Add a phone number</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (vendorOutage) {
    return (
      <div className="phone-setup">
        <h1>Add a phone number</h1>
        <div className="usa-alert usa-alert--warning">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Phone verification temporarily unavailable</h2>
            <p className="usa-alert__text">
              We&apos;re experiencing technical difficulties with phone verification. Please try
              again later or choose a different authentication method.
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
    <div className="phone-setup">
      <h1>Add a phone number</h1>

      <p className="usa-intro">
        We&apos;ll send you a one-time code by text message or phone call when you sign in.
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
          <label className="usa-label" htmlFor="country-code">
            Country code
          </label>
          <select
            className="usa-select"
            id="country-code"
            name="country-code"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={`${c.abbr}-${c.code}`} value={c.code}>
                {c.country}
              </option>
            ))}
          </select>
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="phone">
            Phone number <span className="usa-hint text-base">(required)</span>
          </label>
          <input
            className="usa-input"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            aria-describedby="phone-hint"
          />
          <span id="phone-hint" className="usa-hint">
            We&apos;ll send a one-time code to this number
          </span>
        </div>

        <fieldset className="usa-fieldset margin-top-3">
          <legend className="usa-legend">How should we send you codes?</legend>

          <div className="usa-radio">
            <input
              className="usa-radio__input"
              id="delivery-sms"
              type="radio"
              name="delivery-preference"
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
              name="delivery-preference"
              value="voice"
              checked={deliveryPreference === 'voice'}
              onChange={() => setDeliveryPreference('voice')}
            />
            <label className="usa-radio__label" htmlFor="delivery-voice">
              Phone call
            </label>
          </div>
        </fieldset>

        <div className="usa-form-group margin-top-3">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="make-default"
              type="checkbox"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
            />
            <label className="usa-checkbox__label" htmlFor="make-default">
              Make this my default phone number
            </label>
          </div>
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending code...' : 'Send code'}
          </button>
          <Link href="/signup/mfa" className="usa-button usa-button--outline margin-left-2">
            Cancel
          </Link>
        </div>

        <p className="margin-top-4 text-base">
          Message and data rates may apply. We will only use your phone number for two-factor
          authentication.
        </p>
      </form>
    </div>
  );
}
