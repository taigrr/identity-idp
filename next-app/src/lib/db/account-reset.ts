/**
 * Account Reset Service
 * Mirrors: app/services/account_reset/create_request.rb
 *          app/services/account_reset/cancel.rb
 *          app/services/account_reset/delete_account.rb
 *
 * Handles account reset requests for users who have lost all MFA methods.
 */

import { eq, and, isNull, sql } from 'drizzle-orm';
import {
  db,
  accountResetRequests,
  deletedUsers,
  users,
  emailAddresses,
  type AccountResetRequest,
  type User,
} from '@/db';
import { randomUUID } from 'crypto';

export interface CreateResetRequestResult {
  success: boolean;
  request?: AccountResetRequest;
  error?: string;
}

export interface CancelResetRequestResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export interface DeleteAccountResult {
  success: boolean;
  accountAgeInDays?: number;
  error?: string;
}

/**
 * Creates or updates an account reset request for a user.
 * Mirrors: AccountReset::CreateRequest#create_request
 */
export async function createAccountResetRequest(
  userId: number,
  requestingIssuer?: string
): Promise<CreateResetRequestResult> {
  try {
    const now = new Date();
    const requestToken = randomUUID();

    // Check for existing request
    const existing = await db.query.accountResetRequests.findFirst({
      where: eq(accountResetRequests.userId, userId),
    });

    const updateData = {
      requestToken,
      requestedAt: now,
      cancelledAt: null,
      grantedAt: null,
      grantedToken: null,
      requestingIssuer: requestingIssuer ?? null,
      updatedAt: now,
    };

    let request: AccountResetRequest;

    if (existing) {
      // Update existing request
      const [updated] = await db
        .update(accountResetRequests)
        .set(updateData)
        .where(eq(accountResetRequests.userId, userId))
        .returning();
      request = updated;
    } else {
      // Create new request
      const [created] = await db
        .insert(accountResetRequests)
        .values({
          userId,
          ...updateData,
          createdAt: now,
        })
        .returning();
      request = created;
    }

    return { success: true, request };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Finds an account reset request by request token.
 */
export async function findByRequestToken(
  token: string
): Promise<AccountResetRequest | null> {
  const request = await db.query.accountResetRequests.findFirst({
    where: eq(accountResetRequests.requestToken, token),
  });
  return request ?? null;
}

/**
 * Finds an account reset request by granted token.
 */
export async function findByGrantedToken(
  token: string
): Promise<AccountResetRequest | null> {
  const request = await db.query.accountResetRequests.findFirst({
    where: eq(accountResetRequests.grantedToken, token),
  });
  return request ?? null;
}

/**
 * Finds a pending account reset request for a user.
 * Mirrors: AccountReset::PendingRequestForUser
 */
export async function getPendingRequestForUser(
  userId: number
): Promise<AccountResetRequest | null> {
  const request = await db.query.accountResetRequests.findFirst({
    where: and(
      eq(accountResetRequests.userId, userId),
      sql`${accountResetRequests.requestedAt} IS NOT NULL`,
      isNull(accountResetRequests.cancelledAt),
      isNull(accountResetRequests.grantedAt)
    ),
  });
  return request ?? null;
}

/**
 * Validates a cancel token and returns the request if valid.
 */
export async function validateCancelToken(
  token: string
): Promise<{ valid: boolean; request?: AccountResetRequest; error?: string }> {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  const request = await findByRequestToken(token);

  if (!request) {
    return { valid: false, error: 'Invalid token' };
  }

  if (request.cancelledAt) {
    return { valid: false, error: 'Request already cancelled' };
  }

  if (request.grantedAt) {
    return { valid: false, error: 'Request already granted' };
  }

  return { valid: true, request };
}

/**
 * Validates a granted token and returns the request if valid.
 */
export async function validateGrantedToken(
  token: string
): Promise<{ valid: boolean; request?: AccountResetRequest; user?: User; error?: string }> {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  const request = await findByGrantedToken(token);

  if (!request) {
    return { valid: false, error: 'Invalid token' };
  }

  if (request.cancelledAt) {
    return { valid: false, error: 'Request was cancelled' };
  }

  if (!request.grantedAt) {
    return { valid: false, error: 'Request not yet granted' };
  }

  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(users.id, request.userId),
  });

  if (!user) {
    return { valid: false, error: 'User not found' };
  }

  return { valid: true, request, user };
}

/**
 * Cancels an account reset request.
 * Mirrors: AccountReset::Cancel#update_account_reset_request
 */
export async function cancelAccountResetRequest(
  token: string
): Promise<CancelResetRequestResult> {
  const validation = await validateCancelToken(token);

  if (!validation.valid || !validation.request) {
    return { success: false, error: validation.error };
  }

  const now = new Date();

  await db
    .update(accountResetRequests)
    .set({
      cancelledAt: now,
      requestToken: null,
      grantedToken: null,
      updatedAt: now,
    })
    .where(eq(accountResetRequests.id, validation.request.id));

  // Get user UUID for analytics
  const user = await db.query.users.findFirst({
    where: eq(users.id, validation.request.userId),
  });

  return { success: true, userId: user?.uuid };
}

/**
 * Grants an account reset request (called after waiting period).
 */
export async function grantAccountResetRequest(
  requestId: number
): Promise<{ success: boolean; grantedToken?: string; error?: string }> {
  const now = new Date();
  const grantedToken = randomUUID();

  try {
    await db
      .update(accountResetRequests)
      .set({
        grantedAt: now,
        grantedToken,
        updatedAt: now,
      })
      .where(eq(accountResetRequests.id, requestId));

    return { success: true, grantedToken };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deletes a user account after reset is granted.
 * Mirrors: AccountReset::DeleteAccount#handle_successful_submission
 */
export async function deleteUserAccount(
  grantedToken: string
): Promise<DeleteAccountResult> {
  const validation = await validateGrantedToken(grantedToken);

  if (!validation.valid || !validation.user) {
    return { success: false, error: validation.error };
  }

  const user = validation.user;
  const now = new Date();

  // Calculate account age
  let accountAgeInDays: number | undefined;
  if (user.confirmedAt) {
    const ageMs = now.getTime() - user.confirmedAt.getTime();
    accountAgeInDays = Math.round(ageMs / (1000 * 60 * 60 * 24));
  }

  try {
    await db.transaction(async (tx) => {
      // Create deleted user record
      await tx.insert(deletedUsers).values({
        userId: user.id,
        uuid: user.uuid,
        userCreatedAt: user.createdAt ?? now,
        deletedAt: now,
      });

      // Delete user (cascades to related records via FK constraints)
      await tx.delete(users).where(eq(users.id, user.id));
    });

    return { success: true, accountAgeInDays };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets user's confirmed email addresses for notifications.
 */
export async function getUserConfirmedEmails(userId: number): Promise<string[]> {
  const emails = await db.query.emailAddresses.findMany({
    where: and(
      eq(emailAddresses.userId, userId),
      sql`${emailAddresses.confirmedAt} IS NOT NULL`
    ),
  });

  // Note: In production, you'd decrypt the emails here
  return emails.map((e) => e.encryptedEmail);
}

/**
 * Checks if a user has any pending account reset requests.
 */
export async function hasPendingResetRequest(userId: number): Promise<boolean> {
  const request = await getPendingRequestForUser(userId);
  return request !== null;
}
