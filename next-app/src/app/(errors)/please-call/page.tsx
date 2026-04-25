/**
 * Please Call Page (Suspended User)
 * Mirrors: app/controllers/users/please_call_controller.rb
 */

import Link from 'next/link';

export default function PleaseCallPage() {
  return (
    <div className="please-call">
      <h1>We need to verify your identity</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Your account has been suspended</h2>
          <p className="usa-alert__text">
            For your security, we&apos;ve temporarily suspended your account. Please contact us to
            verify your identity and restore access.
          </p>
        </div>
      </div>

      <h2>How to restore your account</h2>

      <ol className="usa-process-list">
        <li className="usa-process-list__item">
          <h3 className="usa-process-list__heading">Call our support team</h3>
          <p>
            Contact Login.gov support at{' '}
            <a href="tel:1-844-875-6446" className="usa-link">
              (844) 875-6446
            </a>
          </p>
        </li>
        <li className="usa-process-list__item">
          <h3 className="usa-process-list__heading">Verify your identity</h3>
          <p>
            Be prepared to verify your identity over the phone. You may need your government-issued
            ID.
          </p>
        </li>
        <li className="usa-process-list__item">
          <h3 className="usa-process-list__heading">Restore access</h3>
          <p>Once verified, our team will help you regain access to your account.</p>
        </li>
      </ol>

      <div className="usa-alert usa-alert--info margin-top-4">
        <div className="usa-alert__body">
          <h3 className="usa-alert__heading">Why was my account suspended?</h3>
          <p className="usa-alert__text">
            Accounts may be suspended due to unusual activity, security concerns, or verification
            requirements. Our support team can provide more information about your specific
            situation.
          </p>
        </div>
      </div>

      <div className="margin-top-4">
        <h2>Contact information</h2>
        <ul className="usa-list">
          <li>
            <strong>Phone:</strong>{' '}
            <a href="tel:1-844-875-6446" className="usa-link">
              (844) 875-6446
            </a>
          </li>
          <li>
            <strong>Hours:</strong> Monday - Friday, 8am - 8pm ET
          </li>
        </ul>
      </div>

      <div className="margin-top-4">
        <Link href="/" className="usa-link">
          Return to Login.gov
        </Link>
      </div>
    </div>
  );
}
