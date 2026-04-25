/**
 * Country Support API
 * /api/country-support
 * Mirrors: app/controllers/country_support_controller.rb
 *
 * Returns list of countries with SMS/voice support for phone verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCountryDialingCodes } from '@/lib/phone/country-codes';

// Cache for 15 minutes (900 seconds) to match Rails
const CACHE_MAX_AGE = 900;

export async function GET(request: NextRequest) {
  // Get locale from Accept-Language header or default to 'en'
  const acceptLanguage = request.headers.get('accept-language');
  const locale = acceptLanguage?.split(',')[0]?.split('-')[0] ?? 'en';

  const countries = await getCountryDialingCodes(locale);

  return NextResponse.json(
    { countries },
    {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
      },
    }
  );
}
