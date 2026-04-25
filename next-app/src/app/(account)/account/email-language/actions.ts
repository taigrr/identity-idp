'use server';

/**
 * Email Language Actions
 * Mirrors: app/controllers/users/email_language_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function getUserEmailLanguage(userId: string): Promise<string> {
  // TODO: Get from database
  return 'en';
}

async function updateUserEmailLanguage(userId: string, language: string): Promise<void> {
  // TODO: Update in database
  console.log('Updating email language:', { userId, language });
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'zh-CN', name: '简体中文 (Chinese, Simplified)' },
  { code: 'zh-TW', name: '繁體中文 (Chinese, Traditional)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'tl', name: 'Tagalog' },
];

/**
 * Get email language settings
 */
export async function getEmailLanguageData(): Promise<{
  currentLanguage: string;
  languages: typeof SUPPORTED_LANGUAGES;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  const currentLanguage = await getUserEmailLanguage(session.userId);

  return {
    currentLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

/**
 * Update email language
 */
export async function updateEmailLanguage(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const language = formData.get('language')?.toString();
  if (!language || !SUPPORTED_LANGUAGES.some((l) => l.code === language)) {
    return { success: false, error: 'Invalid language selection' };
  }

  await updateUserEmailLanguage(session.userId, language);

  redirect('/account');
}
