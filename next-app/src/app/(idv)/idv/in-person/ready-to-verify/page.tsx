/**
 * Ready to Verify Page
 * /idv/in-person/ready-to-verify
 * Shows the enrollment barcode and instructions for USPS visit
 * Mirrors: app/controllers/idv/in_person/ready_to_verify_controller.rb
 */

import Link from 'next/link';

// TODO: Get enrollment data from session/database
interface Enrollment {
  enrollmentCode: string;
  selectedLocation: {
    name: string;
    streetAddress: string;
    formattedCityStateZip: string;
    weekdayHours: string;
    saturdayHours: string;
    sundayHours: string;
  };
  expiresAt: Date;
}

// Mock enrollment data - in production this comes from the database
function getEnrollment(): Enrollment | null {
  return {
    enrollmentCode: 'ABCD1234EFGH5678',
    selectedLocation: {
      name: 'Downtown Post Office',
      streetAddress: '100 Main St',
      formattedCityStateZip: 'Washington, DC 20001',
      weekdayHours: '9:00 AM - 5:00 PM',
      saturdayHours: '9:00 AM - 1:00 PM',
      sundayHours: 'Closed',
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };
}

export default function ReadyToVerifyPage() {
  const enrollment = getEnrollment();

  if (!enrollment) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">No enrollment found</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have an active in-person verification enrollment.
        </p>
        <Link
          href="/idv"
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Start identity verification
        </Link>
      </div>
    );
  }

  const expirationDate = enrollment.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Ready to verify at the Post Office</h1>
        <p className="text-gray-600">
          Visit your selected Post Office to complete identity verification.
        </p>
      </div>

      {/* Enrollment Barcode */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-6 text-center">
        <h2 className="text-sm font-medium text-gray-500 mb-2">YOUR ENROLLMENT CODE</h2>
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          {/* In production, this would be an actual barcode image */}
          <div className="h-24 bg-black mx-auto max-w-xs mb-2 flex items-center justify-center">
            <span className="text-white font-mono text-xs">BARCODE</span>
          </div>
          <p className="font-mono text-2xl tracking-wider">{enrollment.enrollmentCode}</p>
        </div>
        <p className="text-sm text-gray-500">
          Show this code to the Post Office clerk
        </p>
      </div>

      {/* Expiration Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important:</strong> Complete your visit by <strong>{expirationDate}</strong>.
          Your enrollment will expire after this date.
        </p>
      </div>

      {/* Selected Location */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-3">Your Post Office</h2>
        <p className="font-medium">{enrollment.selectedLocation.name}</p>
        <p className="text-gray-600">{enrollment.selectedLocation.streetAddress}</p>
        <p className="text-gray-600">{enrollment.selectedLocation.formattedCityStateZip}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Weekdays: {enrollment.selectedLocation.weekdayHours}</p>
          <p>Saturday: {enrollment.selectedLocation.saturdayHours}</p>
          <p>Sunday: {enrollment.selectedLocation.sundayHours}</p>
        </div>
        <Link
          href="/idv/in-person/usps-locations"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-4 inline-block"
        >
          Choose a different Post Office
        </Link>
      </div>

      {/* What to Bring */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-blue-900 mb-3">What to bring</h2>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This enrollment code (print or show on your phone)</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your state-issued ID (must match the information you provided)</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Print this page
        </button>
        <Link
          href="/account"
          className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to your account
        </Link>
      </div>

      <p className="text-sm text-gray-500 text-center mt-6">
        After your Post Office visit, check back here for verification status.
        This process usually takes 24 hours.
      </p>
    </div>
  );
}
