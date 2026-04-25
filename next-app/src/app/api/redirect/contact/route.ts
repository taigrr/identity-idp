import { NextRequest, NextResponse } from 'next/server';

/**
 * Contact Page Redirect
 * Mirrors: app/controllers/redirect/contact_controller.rb
 * Route: GET /redirect/contact
 */

const MARKETING_SITE_URL = process.env.MARKETING_SITE_URL || 'https://login.gov';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') || 'en';

  const contactUrl = new URL(`${MARKETING_SITE_URL}/contact/`);
  if (locale !== 'en') {
    contactUrl.searchParams.set('locale', locale);
  }

  return NextResponse.redirect(contactUrl.toString(), { status: 302 });
}
