'use server';

/**
 * Account Dashboard Server Actions
 * Mirrors: app/controllers/accounts_controller.rb
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface AccountInfo {
  uuid: string;
  email: string;
  confirmedEmails: string[];
  phoneConfigs: PhoneConfig[];
  totpConfigs: TotpConfig[];
  webauthnConfigs: WebauthnConfig[];
  backupCodesConfigured: boolean;
  backupCodeUsedCount: number;
  pivCacConfigs: PivCacConfig[];
  personalKeyRegenerated: Date | null;
  identityVerified: boolean;
  verifiedProfile: VerifiedProfile | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneConfig {
  id: string;
  phone: string;
  isDefault: boolean;
  deliveryPreference: 'sms' | 'voice';
  createdAt: Date;
}

export interface TotpConfig {
  id: string;
  name: string;
  createdAt: Date;
}

export interface WebauthnConfig {
  id: string;
  name: string;
  platformAuthenticator: boolean;
  createdAt: Date;
}

export interface PivCacConfig {
  id: string;
  name: string;
  x509Subject: string;
  createdAt: Date;
}

export interface VerifiedProfile {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;
  dateOfBirth: string;
  ssnLast4: string;
  phone?: string;
  verifiedAt: Date;
}

export interface AccountState {
  success: boolean;
  error?: string;
  account?: AccountInfo;
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return null;

  // TODO: Replace with actual session lookup
  // const session = await SessionManager.get(sessionId);
  // return session?.userId ?? null;
  return null;
}

export async function getAccountInfo(): Promise<AccountState> {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect('/login');
  }

  // TODO: Replace with actual database lookup
  // const user = await db.query.users.findFirst({
  //   where: eq(users.uuid, userId),
  //   with: {
  //     emailAddresses: true,
  //     phoneConfigurations: true,
  //     authAppConfigurations: true,
  //     webauthnConfigurations: true,
  //     backupCodeConfigurations: true,
  //     pivCacConfigurations: true,
  //     profiles: true,
  //   },
  // });

  // Mock data for development
  const account: AccountInfo = {
    uuid: userId,
    email: 'user@example.com',
    confirmedEmails: ['user@example.com'],
    phoneConfigs: [],
    totpConfigs: [],
    webauthnConfigs: [],
    backupCodesConfigured: false,
    backupCodeUsedCount: 0,
    pivCacConfigs: [],
    personalKeyRegenerated: null,
    identityVerified: false,
    verifiedProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { success: true, account };
}

export async function hasMfaConfigured(): Promise<boolean> {
  const result = await getAccountInfo();
  if (!result.success || !result.account) return false;

  const { phoneConfigs, totpConfigs, webauthnConfigs, backupCodesConfigured, pivCacConfigs } =
    result.account;

  return (
    phoneConfigs.length > 0 ||
    totpConfigs.length > 0 ||
    webauthnConfigs.length > 0 ||
    backupCodesConfigured ||
    pivCacConfigs.length > 0
  );
}

export async function getMfaCount(): Promise<number> {
  const result = await getAccountInfo();
  if (!result.success || !result.account) return 0;

  const { phoneConfigs, totpConfigs, webauthnConfigs, backupCodesConfigured, pivCacConfigs } =
    result.account;

  return (
    phoneConfigs.length +
    totpConfigs.length +
    webauthnConfigs.length +
    (backupCodesConfigured ? 1 : 0) +
    pivCacConfigs.length
  );
}
