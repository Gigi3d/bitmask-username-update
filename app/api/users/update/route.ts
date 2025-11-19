import { NextRequest, NextResponse } from 'next/server';
import { UserUpdateData } from '@/types';
import { addUserUpdate, checkDuplicateUpdate, getCSVData } from '@/lib/storage';

// Force dynamic rendering since this endpoint writes data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldUsername, telegramAccount, newUsername } = body;

    if (!oldUsername || !telegramAccount || !newUsername) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Normalize telegram account for lookup
    const normalizedAccount = telegramAccount.toLowerCase().replace('@', '');
    
    // Get CSV data to validate against
    const csvData = await getCSVData();
    const csvRow = csvData.get(normalizedAccount);

    if (!csvRow) {
      return NextResponse.json(
        { message: 'Telegram account not found in campaign records' },
        { status: 400 }
      );
    }

    // Validate old username matches CSV data
    if (csvRow.oldUsername !== oldUsername) {
      return NextResponse.json(
        { message: 'Old username does not match records for this Telegram account' },
        { status: 400 }
      );
    }

    // Validate new username matches CSV data (only if CSV has a newUsername value)
    // If CSV newUsername is empty, allow any newUsername from user
    if (csvRow.newUsername && csvRow.newUsername.trim() !== '' && csvRow.newUsername !== newUsername) {
      return NextResponse.json(
        { message: 'New username does not match expected value from records' },
        { status: 400 }
      );
    }

    // Check for duplicate updates using optimized function
    const isDuplicate = await checkDuplicateUpdate(telegramAccount, newUsername);

    if (isDuplicate) {
      return NextResponse.json(
        { message: 'This update has already been submitted' },
        { status: 409 }
      );
    }

    // Create update record
    const updateRecord: UserUpdateData = {
      oldUsername,
      telegramAccount,
      newUsername,
      submittedAt: new Date().toISOString(),
    };

    // Store in InstantDB
    await addUserUpdate(updateRecord);

    return NextResponse.json({
      message: 'Username updated successfully',
      data: updateRecord,
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating username:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update username';
    return NextResponse.json(
      { 
        message: 'Failed to update username',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

