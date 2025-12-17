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

    // Validate lengths (allow up to 100 characters to accommodate @bitmask.app suffix)
    if (oldUsername.length > 100 || newUsername.length > 100) {
      return createValidationError('Username is too long (maximum 100 characters)');
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

    // Get CSV data to validate against
    const csvData = await getCSVData();

    // Find matching record by searching BOTH oldUsername AND npubKey
    let csvRow = null;

    for (const row of csvData.values()) {
      let isMatch = false;

      // Check if npubKey matches (if provided)
      if (npubKey && row.npubKey && row.npubKey.toLowerCase().trim() === npubKey.toLowerCase().trim()) {
        isMatch = true;
      }

      // Check if oldUsername matches (if not already matched and if oldUsername exists)
      if (!isMatch && oldUsername && row.oldUsername) {
        const normalizedInput = normalizeBitmaskUsername(oldUsername);
        const normalizedRow = normalizeBitmaskUsername(row.oldUsername);
        if (normalizedRow === normalizedInput) {
          isMatch = true;
        }
      }

      if (isMatch) {
        csvRow = row;
        break;
      }
    }

    if (!csvRow) {
      return createNotFoundError('Identifier not found in campaign records. Please verify you entered the correct username or nPUB key from Step 1.');
    }

    // Record found - no additional validation needed
    // User can update to any new username

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
