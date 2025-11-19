import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';

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
      return NextResponse.json(
        { 
          valid: false,
          message: 'Telegram account is required' 
        },
        { status: 400 }
      );
    }

    if (!oldUsername) {
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
    
    // Normalize telegram account (remove @, lowercase)
    const normalizedAccount = telegramAccount.toLowerCase().replace('@', '');
    
    // Check if telegram account exists in CSV data
    const csvRow = csvData.get(normalizedAccount);
    
    if (!csvRow) {
      return NextResponse.json({
        valid: false,
        message: 'Telegram account not found in campaign records',
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Verify that the telegram account matches the old username
    if (csvRow.oldUsername.toLowerCase().trim() !== oldUsername.toLowerCase().trim()) {
      return NextResponse.json({
        valid: false,
        message: `Telegram account does not match the old username "${oldUsername}". Expected username for this account: "${csvRow.oldUsername}"`,
        expectedUsername: csvRow.oldUsername,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Both telegram account exists and matches old username
    return NextResponse.json({
      valid: true,
      message: 'Telegram account verified and matches old username',
      data: csvRow,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error verifying user:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify user';
    return NextResponse.json(
      { 
        valid: false,
        message: 'Failed to verify user',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

