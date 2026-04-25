/**
 * Service Provider Inactive Page
 * Mirrors: app/controllers/users/service_provider_inactive_controller.rb
 */

import Link from 'next/link';

export default function ServiceProviderInactivePage() {
  return (
    <div className="sp-inactive">
      <h1>This service is currently unavailable</h1>

      <div className="usa-alert usa-alert--error margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            The service you&apos;re trying to access is not currently available through Login.gov.
          </p>
        </div>
      </div>

      <p>
        This may be because the service provider has temporarily disabled access or is undergoing
        maintenance.
      </p>

      <h2>What you can do</h2>

      <ul className="usa-list">
        <li>Try again later</li>
        <li>Contact the service provider directly for assistance</li>
        <li>Visit the service provider&apos;s website for more information</li>
      </ul>

      <div className="margin-top-4">
        <Link href="/account" className="usa-button">
          Go to your Login.gov account
        </Link>
      </div>

      <div className="margin-top-4">
        <Link href="/" className="usa-link">
          Return to Login.gov home
        </Link>
      </div>
    </div>
  );
}
