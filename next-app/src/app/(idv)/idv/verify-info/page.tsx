/**
 * IDV Verify Info Page
 * Mirrors: app/controllers/idv/verify_info_controller.rb
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitVerifyInfo } from '../actions';
import { getIdvSession, type IdvSessionData } from '@/lib/idv/session';

export default function IdvVerifyInfoPage() {
  const router = useRouter();
  const [session, setSession] = useState<IdvSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const idvSession = await getIdvSession();
      setSession(idvSession);
      setIsLoading(false);
    }
    loadSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitVerifyInfo();
      
      if (result.success) {
        router.push('/idv/phone');
      } else {
        setError(result.error || 'Verification failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="idv-verify-info">
        <h1>Verify your information</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const pii = session?.piiFromDoc;
  const ssn = session?.ssn;

  if (!pii || !ssn) {
    return (
      <div className="idv-verify-info">
        <h1>Verify your information</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Missing required information. Please start over.</p>
          </div>
        </div>
        <Link href="/idv" className="usa-link">
          Start over
        </Link>
      </div>
    );
  }

  // Format SSN for display
  const maskedSsn = `***-**-${ssn.slice(-4)}`;

  return (
    <div className="idv-verify-info">
      <h1>Verify your information</h1>

      <p className="usa-intro margin-bottom-4">
        Please review the information below. This is what we extracted from your ID and what
        you entered.
      </p>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-base-lightest padding-3 margin-bottom-4">
        <h2 className="margin-top-0">Personal Information</h2>
        
        <dl className="usa-summary-box__list">
          <div className="grid-row margin-bottom-2">
            <dt className="grid-col-4 text-bold">Full name</dt>
            <dd className="grid-col-8 margin-0">
              {pii.firstName} {pii.lastName}
            </dd>
          </div>

          <div className="grid-row margin-bottom-2">
            <dt className="grid-col-4 text-bold">Date of birth</dt>
            <dd className="grid-col-8 margin-0">
              {pii.dateOfBirth}
            </dd>
          </div>

          <div className="grid-row margin-bottom-2">
            <dt className="grid-col-4 text-bold">Social Security number</dt>
            <dd className="grid-col-8 margin-0">
              {maskedSsn}
              <Link href="/idv/ssn" className="usa-link margin-left-2">
                Edit
              </Link>
            </dd>
          </div>
        </dl>

        <h2>Address</h2>
        
        <dl className="usa-summary-box__list">
          <div className="grid-row margin-bottom-2">
            <dt className="grid-col-4 text-bold">Street address</dt>
            <dd className="grid-col-8 margin-0">
              {pii.address1}
              {pii.address2 && <br />}
              {pii.address2}
            </dd>
          </div>

          <div className="grid-row margin-bottom-2">
            <dt className="grid-col-4 text-bold">City, State, ZIP</dt>
            <dd className="grid-col-8 margin-0">
              {pii.city}, {pii.state} {pii.zipcode}
            </dd>
          </div>
        </dl>

        {pii.stateIdType && (
          <>
            <h2>ID Document</h2>
            
            <dl className="usa-summary-box__list">
              <div className="grid-row margin-bottom-2">
                <dt className="grid-col-4 text-bold">Document type</dt>
                <dd className="grid-col-8 margin-0">
                  {pii.stateIdType === 'drivers_license'
                    ? "Driver's license"
                    : pii.stateIdType === 'state_id_card'
                      ? 'State ID card'
                      : 'Passport'}
                </dd>
              </div>

              {pii.stateIdJurisdiction && (
                <div className="grid-row margin-bottom-2">
                  <dt className="grid-col-4 text-bold">Issuing state</dt>
                  <dd className="grid-col-8 margin-0">
                    {pii.stateIdJurisdiction}
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <p className="margin-bottom-3">
          By clicking the button below, you confirm that the information above is accurate and
          consent to Login.gov verifying this information with authoritative sources.
        </p>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify my information'}
        </button>
      </form>

      <div className="margin-top-4">
        <Link href="/idv/ssn" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}
