import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';

/**
 * API endpoint to verify if an old username exists in the CSV database
 * 
 * POST /api/users/verify-old-username
 * Body: { oldUsername: string }
 */

// Allow caching since this is a read-only verification endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldUsername } = body;

    if (!oldUsername || typeof oldUsername !== 'string') {
      return NextResponse.json(
        { 
          valid: false,
          message: 'Old username is required' 
        },
        { status: 400 }
      );
    }

    // Get CSV data
    const csvData = await getCSVData();
    
    // Search for old username in CSV data
    // Since CSV is keyed by telegram account, we need to search all records
    const matchingRecords: Array<{ telegramAccount: string; newUsername: string }> = [];
    
    for (const row of csvData.values()) {
      if (row.oldUsername.toLowerCase().trim() === oldUsername.toLowerCase().trim()) {
        matchingRecords.push({
          telegramAccount: row.telegramAccount,
          newUsername: row.newUsername || '',
        });
      }
    }
    
    if (matchingRecords.length === 0) {
      return NextResponse.json({
        valid: false,
        message: `Old username "${oldUsername}" not found in campaign records. Please verify you entered the correct username from the campaign.`,
        details: process.env.NODE_ENV === 'development' 
          ? `Searched ${csvData.size} records in the database.`
          : undefined
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // If username found, return success with associated telegram accounts
    return NextResponse.json({
      valid: true,
      message: 'Old username verified',
      telegramAccounts: matchingRecords.map(r => r.telegramAccount),
      // Include count for reference
      matchCount: matchingRecords.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error verifying old username:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify old username';
    return NextResponse.json(
      { 
        valid: false,
        message: 'Failed to verify old username',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

