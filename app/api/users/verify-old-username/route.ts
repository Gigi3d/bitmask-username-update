import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';
import { validateIdentifier, normalizeBitmaskUsername } from '@/lib/utils';
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

    // Search for identifier in CSV data - check BOTH oldUsername AND npubKey fields
    const matchingRecords: Array<{ newUsername: string; matchedField: 'username' | 'npubKey' }> = [];

    for (const row of csvData.values()) {
      let isMatch = false;
      let matchedField: 'username' | 'npubKey' | null = null;

      // Always check BOTH fields regardless of detected type

      // Check if it matches the npubKey field
      if (row.npubKey && row.npubKey.toLowerCase().trim() === identifier.toLowerCase().trim()) {
        isMatch = true;
        matchedField = 'npubKey';
      }

      // Check if it matches the oldUsername field (if not already matched)
      if (!isMatch && row.oldUsername) {
        const normalizedInput = normalizeBitmaskUsername(identifier);
        const normalizedOld = normalizeBitmaskUsername(row.oldUsername);
        if (normalizedOld === normalizedInput) {
          isMatch = true;
          matchedField = 'username';
        }
      }

      if (isMatch && matchedField) {
        matchingRecords.push({
          newUsername: row.newUsername || '',
          matchedField,
        });
      }
    }

    if (matchingRecords.length === 0) {
      return NextResponse.json({
        valid: false,
        message: `Identifier "${identifier}" not found in campaign records. Please verify you entered the correct username or nPUB key from the campaign.`,
        details: process.env.NODE_ENV === 'development'
          ? `Searched ${csvData.size} records in the database (checked both username and npubKey fields).`
          : undefined
      }, {
        headers: createCacheHeaders(),
      });
    }

    // If identifier found, return success
    const firstMatch = matchingRecords[0];
    const matchedFieldLabel = firstMatch.matchedField === 'npubKey' ? 'nPUB key' : 'Username';

    return NextResponse.json({
      valid: true,
      message: `${matchedFieldLabel} verified successfully`,
      identifierType: firstMatch.matchedField === 'npubKey' ? 'npubKey' : 'username',
      matchCount: matchingRecords.length,
      matchedField: firstMatch.matchedField,
    }, {
      headers: createCacheHeaders(),
    });
  } catch (error) {
    return handleApiError(error, 500, 'Failed to verify identifier');
  }
}
