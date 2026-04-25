'use client';

/**
 * PIV/CAC Mismatch Page
 * Mirrors: app/controllers/two_factor_authentication/piv_cac_mismatch_controller.rb
 * Route: /two-factor/piv-cac/mismatch
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MismatchPageProps {
  searchParams: {
    piv_required?: string;
    has_other_methods?: string;
  };
}

export default function PivCacMismatchPage({ searchParams }: MismatchPageProps) {
  const router = useRouter();
  const [addNewPivCac, setAddNewPivCac] = useState(true);

  const pivCacRequired = searchParams.piv_required === 'true';
  const hasOtherMethods = searchParams.has_other_methods !== 'false';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addNewPivCac) {
      // Set session flag and go to options to complete sign-in
      router.push(`/two-factor?add_piv_cac_after_2fa=true`);
    } else {
      router.push('/two-factor');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">PIV/CAC mismatch</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          The PIV/CAC you presented doesn&apos;t match any of the PIV/CAC credentials linked to your account.
        </p>
      </div>

      {pivCacRequired && !hasOtherMethods && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700 font-medium">
            This service provider requires PIV/CAC authentication.
          </p>
          <p className="text-red-700 mt-2">
            You must add this PIV/CAC to your account or use a PIV/CAC that is already linked.
          </p>
        </div>
      )}

      <p className="text-gray-600 mb-6">
        This can happen if you received a new PIV/CAC card or are using a different one than before.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 mb-6">
          <label className="flex items-start p-4 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="add_piv_cac"
              checked={addNewPivCac}
              onChange={() => setAddNewPivCac(true)}
              className="mt-1 mr-3"
            />
            <div>
              <span className="font-medium">Add this PIV/CAC to my account</span>
              <p className="text-sm text-gray-600 mt-1">
                After signing in with another method, you can add this PIV/CAC to your account.
              </p>
            </div>
          </label>

          {hasOtherMethods && !pivCacRequired && (
            <label className="flex items-start p-4 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="add_piv_cac"
                checked={!addNewPivCac}
                onChange={() => setAddNewPivCac(false)}
                className="mt-1 mr-3"
              />
              <div>
                <span className="font-medium">Use a different authentication method</span>
                <p className="text-sm text-gray-600 mt-1">
                  Sign in using another method linked to your account.
                </p>
              </div>
            </label>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Continue
        </button>
      </form>

      <div className="text-center">
        <Link href="/sign-in" className="text-gray-600 hover:underline text-sm">
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}
