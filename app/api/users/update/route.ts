import { NextRequest, NextResponse } from 'next/server';
import { UserUpdateData } from '@/types';
import { addUserUpdate, checkDuplicateUpdate, getCSVData } from '@/lib/storage';
import { checkRateLimit, getClientIp, RateLimitConfigs } from '@/lib/rateLimit';
import { sanitizeUsername, sanitizeTelegramHandle, sanitizeNpubKey, sanitizeTrackingId } from '@/lib/sanitize';
import { normalizeTelegramAccount } from '@/lib/utils';
import { handleApiError, createValidationError, createNotFoundError, createConflictError } from '@/lib/apiHelpers';

// Force dynamic rendering since this endpoint writes data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = checkRateLimit(clientIp, RateLimitConfigs.formSubmission);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body = await request.json();
    let { oldUsername, telegramAccount, newUsername, npubKey, trackingId } = body;

    // Sanitize inputs
    oldUsername = sanitizeUsername(oldUsername);
    telegramAccount = sanitizeTelegramHandle(telegramAccount);
    newUsername = sanitizeUsername(newUsername);
    if (npubKey) npubKey = sanitizeNpubKey(npubKey);
    if (trackingId) trackingId = sanitizeTrackingId(trackingId);

    // Validation
    if (!oldUsername || !telegramAccount || !newUsername) {
      return createValidationError('All fields are required');
    }

    // Validate lengths
    if (oldUsername.length > 50 || newUsername.length > 50) {
      return createValidationError('Username must be 50 characters or less');
    }

    if (telegramAccount.length < 5 || telegramAccount.length > 32) {
      return createValidationError('Telegram handle must be between 5 and 32 characters');
    }

    // Normalize telegram account for lookup
    const normalizedAccount = normalizeTelegramAccount(telegramAccount);

    // Get CSV data to validate against
    const csvData = await getCSVData();
    const csvRow = csvData.get(normalizedAccount);

    if (!csvRow) {
      return createNotFoundError('Telegram account not found in campaign records');
    }

    // Validate old username OR nPUB key matches CSV data
    let identifierMatches = false;

    if (npubKey && csvRow.npubKey) {
      // If nPUB key is provided and exists in CSV, validate it
      identifierMatches = csvRow.npubKey === npubKey;
    } else {
      // Otherwise, validate old username
      identifierMatches = csvRow.oldUsername === oldUsername;
    }

    if (!identifierMatches) {
      return createValidationError('Identifier does not match records for this Telegram account');
    }

    // Validate new username matches CSV data (only if CSV has a newUsername value)
    // If CSV newUsername is empty, allow any newUsername from user
    if (csvRow.newUsername && csvRow.newUsername.trim() !== '' && csvRow.newUsername !== newUsername) {
      return createValidationError('New username does not match expected value from records');
    }

    // Check for duplicate submission
    const isDuplicate = await checkDuplicateUpdate(oldUsername, telegramAccount, npubKey);
    if (isDuplicate) {
      return createConflictError('This update has already been submitted. If you need to make changes, please contact support.');
    }

    // Create update data
    const updateData: UserUpdateData = {
      oldUsername,
      telegramAccount: normalizedAccount,
      newUsername,
      npubKey,
      trackingId,
      submittedAt: Date.now(),
    };

    // Add to database
    const result = await addUserUpdate(updateData);

    if (!result.success) {
      console.error('Failed to add user update:', result.error);
      return NextResponse.json(
        { message: 'Failed to submit update. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Username update submitted successfully',
      trackingId,
    });

  } catch (error) {
    return handleApiError(error, 500, 'An unexpected error occurred. Please try again later.');
  }
}

