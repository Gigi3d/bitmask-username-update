import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';
import { normalizeTelegramAccount } from '@/lib/utils';
import { handleApiError, createValidationError, createNotFoundError, createCacheHeaders } from '@/lib/apiHelpers';

/**
 * API endpoint to verify telegram account matches old username
 * 
 * POST /api/users/verify
 * Body: { oldUsername: string, telegramAccount: string }
 */

// Allow caching since this is a read-only verification endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldUsername, telegramAccount } = body;

    if (!telegramAccount) {
      return createValidationError('Telegram account is required');
    }

    if (!oldUsername) {
      return createValidationError('Old username is required');
    }

    // Get CSV data
    const csvData = await getCSVData();

    // Normalize telegram account
    const normalizedAccount = normalizeTelegramAccount(telegramAccount);

    // Check if telegram account exists in CSV data
    const csvRow = csvData.get(normalizedAccount);

    if (!csvRow) {
      return NextResponse.json({
        valid: false,
        message: 'Telegram account not found in campaign records',
      }, {
        headers: createCacheHeaders(),
      });
    }

    // Verify that the telegram account matches the old username
    if (csvRow.oldUsername.toLowerCase().trim() !== oldUsername.toLowerCase().trim()) {
      return NextResponse.json({
        valid: false,
        message: `Telegram account does not match the old username "${oldUsername}". Expected username for this account: "${csvRow.oldUsername}"`,
        expectedUsername: csvRow.oldUsername,
      }, {
        headers: createCacheHeaders(),
      });
    }

    // Both telegram account exists and matches old username
    return NextResponse.json({
      valid: true,
      message: 'Telegram account verified and matches old username',
      data: csvRow,
    }, {
      headers: createCacheHeaders(),
    });
  } catch (error) {
    return handleApiError(error, 500, 'Failed to verify user');
  }
}

