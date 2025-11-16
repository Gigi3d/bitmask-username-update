import { NextRequest, NextResponse } from 'next/server';
import { UserUpdateData } from '@/types';
import { addUserUpdate } from '@/lib/storage';

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

    // Create update record
    const updateRecord: UserUpdateData = {
      oldUsername,
      telegramAccount,
      newUsername,
      submittedAt: new Date(),
    };

    // Store in memory
    // In production, save to database
    addUserUpdate(updateRecord);

    return NextResponse.json({
      message: 'Username updated successfully',
      data: updateRecord,
    });
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json(
      { message: 'Failed to update username' },
      { status: 500 }
    );
  }
}

