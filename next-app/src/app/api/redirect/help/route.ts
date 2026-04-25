import { NextRequest, NextResponse } from 'next/server';

/**
 * Help Center Redirect
 * Mirrors: app/controllers/redirect/help_center_controller.rb
 * Route: GET /redirect/help
 */

const HELP_CENTER_URL = process.env.HELP_CENTER_URL || 'https://login.gov/help/';

const VALID_CATEGORIES = [
  'get-started',
  'manage-your-account',
  'trouble-signing-in',
  'verify-your-identity',
  'help-with-specific-agencies',
];

const VALID_ARTICLES = [
  'create-an-account',
  'signing-in',
  'authentication-options',
  'verify-your-identity',
  'change-your-password',
  'change-your-phone-number',
  'change-your-email-address',
  'delete-your-account',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const article = searchParams.get('article');
  const locale = searchParams.get('locale') || 'en';

  let targetUrl = HELP_CENTER_URL;

  if (category && VALID_CATEGORIES.includes(category)) {
    targetUrl = `${HELP_CENTER_URL}${category}/`;

    if (article && VALID_ARTICLES.includes(article)) {
      targetUrl = `${targetUrl}${article}/`;
    }
  }

  const url = new URL(targetUrl);
  if (locale !== 'en') {
    url.searchParams.set('locale', locale);
  }

  return NextResponse.redirect(url.toString(), { status: 302 });
}
