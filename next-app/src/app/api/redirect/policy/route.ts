import { NextRequest, NextResponse } from 'next/server';

/**
 * Policy Page Redirect
 * Mirrors: app/controllers/redirect/policy_controller.rb
 * Route: GET /redirect/policy
 */

const MARKETING_SITE_URL = process.env.MARKETING_SITE_URL || 'https://login.gov';

const VALID_POLICIES = ['privacy_act_statement', 'security_and_privacy_practices', 'rules_of_use'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const policy = searchParams.get('policy');
  const locale = searchParams.get('locale') || 'en';

  let targetPath = '/policy/';

  if (policy && VALID_POLICIES.includes(policy)) {
    const pathMap: Record<string, string> = {
      privacy_act_statement: '/policy/our-privacy-act-statement/',
      security_and_privacy_practices: '/policy/our-security-practices/',
      rules_of_use: '/policy/rules-of-use/',
    };
    targetPath = pathMap[policy] || targetPath;
  }

  const url = new URL(`${MARKETING_SITE_URL}${targetPath}`);
  if (locale !== 'en') {
    url.searchParams.set('locale', locale);
  }

  return NextResponse.redirect(url.toString(), { status: 302 });
}
