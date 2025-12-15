import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';
import { validateIdentifier } from '@/lib/utils';
import { handleApiError, createValidationError, createCacheHeaders } from '@/lib/apiHelpers';

/**
 * API endpoint to verify if an old username or nPUB key exists in the CSV database
 * 
 * POST /api/users/verify-old-username
 * Body: { identifier: string } - Can be either username or nPUB key
 */

// Allow caching since this is a read-only verification endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return createValidationError('Username or nPUB key is required');
    }

    // Validate and detect identifier type
    const validation = validateIdentifier(identifier);

    if (!validation.isValid) {
      return createValidationError(validation.error || 'Invalid identifier format');
    }

    // Get CSV data
    const csvData = await getCSVData();

    // Search for identifier in CSV data based on type
    const matchingRecords: Array<{ telegramAccount: string; newUsername: string }> = [];

    for (const row of csvData.values()) {
      let isMatch = false;

      if (validation.type === 'npubKey') {
        // Match by nPUB key
        if (row.npubKey && row.npubKey.toLowerCase().trim() === identifier.toLowerCase().trim()) {
          isMatch = true;
        }
      } else {
        // Match by old username
        if (row.oldUsername.toLowerCase().trim() === identifier.toLowerCase().trim()) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matchingRecords.push({
          telegramAccount: row.telegramAccount,
          newUsername: row.newUsername || '',
        });
      }
    }

    if (matchingRecords.length === 0) {
      const identifierLabel = validation.type === 'npubKey' ? 'nPUB key' : 'username';
      return NextResponse.json({
        valid: false,
        message: `${identifierLabel.charAt(0).toUpperCase() + identifierLabel.slice(1)} "${identifier}" not found in campaign records. Please verify you entered the correct ${identifierLabel} from the campaign.`,
        details: process.env.NODE_ENV === 'development'
          ? `Searched ${csvData.size} records in the database.`
          : undefined
      }, {
        headers: createCacheHeaders(),
      });
    }

    // If identifier found, return success with associated telegram accounts
    return NextResponse.json({
      valid: true,
      message: `${validation.type === 'npubKey' ? 'nPUB key' : 'Username'} verified`,
      identifierType: validation.type,
      telegramAccounts: matchingRecords.map(r => r.telegramAccount),
      matchCount: matchingRecords.length,
    }, {
      headers: createCacheHeaders(),
    });
  } catch (error) {
    return handleApiError(error, 500, 'Failed to verify identifier');
  }
}

