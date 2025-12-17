import { NextRequest, NextResponse } from 'next/server';
import { UserUpdateData } from '@/types';
import { addUserUpdate, canUserUpdate, getUserUpdateAttempts, getCSVData } from '@/lib/storage';
import { checkRateLimit, getClientIp, RateLimitConfigs } from '@/lib/rateLimit';
import { sanitizeUsername, sanitizeNpubKey, sanitizeTrackingId } from '@/lib/sanitize';
import { handleApiError, createValidationError, createNotFoundError } from '@/lib/apiHelpers';
import { normalizeBitmaskUsername } from '@/lib/utils';

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
    let { oldUsername, newUsername, npubKey, trackingId } = body;

    // Sanitize inputs
    oldUsername = sanitizeUsername(oldUsername);
    newUsername = sanitizeUsername(newUsername);
    if (npubKey) npubKey = sanitizeNpubKey(npubKey);
    if (trackingId) trackingId = sanitizeTrackingId(trackingId);

    // Validation
    if (!oldUsername || !newUsername) {
      return createValidationError('Old username and new username are required');
    }

    // Validate lengths
    if (oldUsername.length > 50 || newUsername.length > 50) {
      return createValidationError('Username must be 50 characters or less');
    }

    // Check if user can still update (3-attempt limit)
    const { canUpdate, attemptCount } = await canUserUpdate(oldUsername);

    if (!canUpdate) {
      return NextResponse.json(
        {
          message: 'You have reached the maximum of 3 username updates. No further updates are allowed.',
          attemptCount: 3,
          remainingAttempts: 0,
        },
        { status: 403 }
      );
    }

    // Get CSV data to validate against (use flexible matching)
    const csvData = await getCSVData();
    const normalizedOldUsername = normalizeBitmaskUsername(oldUsername);

    // Find matching record using flexible username matching
    let csvRow = null;
    for (const row of csvData.values()) {
      if (normalizeBitmaskUsername(row.oldUsername) === normalizedOldUsername) {
        csvRow = row;
        break;
      }
    }

    if (!csvRow) {
      return createNotFoundError('Old username not found in campaign records');
    }

    // Validate old username OR nPUB key matches CSV data
    let identifierMatches = false;

    if (npubKey && csvRow.npubKey) {
      // If nPUB key is provided and exists in CSV, validate it
      identifierMatches = csvRow.npubKey === npubKey;
    } else {
      // Otherwise, validate old username
      identifierMatches = csvRow.oldUsername.toLowerCase() === oldUsername.toLowerCase();
    }

    if (!identifierMatches) {
      return createValidationError('Identifier does not match records');
    }

    // Allow any new username - no validation against CSV data

    // Get existing attempts to populate the correct field
    const attempts = await getUserUpdateAttempts(oldUsername);
    const nextAttemptNumber = attemptCount + 1;

    // Generate tracking ID if not provided
    if (!trackingId) {
      trackingId = `BM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    // Create update data with 3-attempt tracking
    const now = Date.now();
    const updateData: UserUpdateData = {
      oldUsername,
      newUsername,
      npubKey,
      trackingId,
      submittedAt: attemptCount === 0 ? now : attempts.attempts[0]?.timestamp || now,
      updateAttemptCount: nextAttemptNumber,
      lastUpdatedAt: now,
      // Populate appropriate field based on attempt number
      firstNewUsername: nextAttemptNumber === 1 ? newUsername : attempts.attempts[0]?.username,
      secondNewUsername: nextAttemptNumber === 2 ? newUsername : attempts.attempts[1]?.username,
      thirdNewUsername: nextAttemptNumber === 3 ? newUsername : attempts.attempts[2]?.username,
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
      attemptNumber: nextAttemptNumber,
      remainingAttempts: 3 - nextAttemptNumber,
    });

  } catch (error) {
    return handleApiError(error, 500, 'An unexpected error occurred. Please try again later.');
  }
}
