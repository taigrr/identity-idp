/**
 * IDV Welcome Page
 * Mirrors: app/controllers/idv/welcome_controller.rb
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { startIdv } from './actions';

export default async function IdvWelcomePage() {
  return (
    <div className="idv-welcome">
      <h1>Verify your identity</h1>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Identity verification helps protect you from fraud and identity theft.
          </p>
        </div>
      </div>

      <div className="idv-intro margin-bottom-4">
        <h2>What you&apos;ll need</h2>
        <ul className="usa-list">
          <li>
            <strong>A valid government ID</strong>
            <p className="margin-top-05">
              Driver&apos;s license or state ID from any U.S. state, territory, or the District of
              Columbia
            </p>
          </li>
          <li>
            <strong>A phone with a camera</strong>
            <p className="margin-top-05">
              You&apos;ll take photos of your ID and a selfie
            </p>
          </li>
          <li>
            <strong>Your Social Security number</strong>
            <p className="margin-top-05">
              We&apos;ll use this to verify your identity
            </p>
          </li>
          <li>
            <strong>A phone number</strong>
            <p className="margin-top-05">
              We&apos;ll verify this phone number is associated with you
            </p>
          </li>
        </ul>
      </div>

      <div className="idv-time-estimate margin-bottom-4">
        <h2>How long it takes</h2>
        <p>
          Most people complete identity verification in <strong>10-15 minutes</strong>.
        </p>
      </div>

      <form action={startIdv}>
        <button type="submit" className="usa-button usa-button--big">
          Get started
        </button>
      </form>

      <div className="margin-top-4">
        <Link href="/account" className="usa-link">
          &larr; Back to account
        </Link>
      </div>
    </div>
  );
}
