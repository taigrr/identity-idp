/**
 * Add Email Page
 * Mirrors: app/controllers/users/emails_controller.rb#show
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { addEmail } from './actions';

export default function AddEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inSelectEmailFlow = searchParams.get('in_select_email_flow') === 'true';

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await addEmail({ email: email.trim() });

      if (result.success) {
        const verifyUrl = new URL('/account/email/verify', window.location.origin);
        verifyUrl.searchParams.set('email', result.email || email);
        if (inSelectEmailFlow) {
          verifyUrl.searchParams.set('in_select_email_flow', 'true');
        }
        router.push(verifyUrl.toString());
      } else {
        setError(result.error || 'Failed to add email');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="add-email">
      <h1>Add email address</h1>

      <p>
        Adding another email address lets you receive Login.gov notifications at multiple addresses
        and gives you more options when signing in to partner agencies.
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
          <label className="usa-label" htmlFor="email">
            Email address <span className="usa-hint text-base">(required)</span>
          </label>
          <input
            className="usa-input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add email'}
          </button>
          <Link href="/account" className="usa-button usa-button--outline margin-left-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
