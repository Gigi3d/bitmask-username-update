import { NextRequest, NextResponse } from 'next/server';
import { getCSVData } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramAccount } = body;

    if (!telegramAccount) {
      return NextResponse.json(
        { message: 'Telegram account is required', valid: false },
        { status: 400 }
      );
    }

    // Get CSV data
    const csvData = await getCSVData();
    
    // Normalize telegram account (remove @, lowercase)
    const normalizedAccount = telegramAccount.toLowerCase().replace('@', '');
    
    // Check if telegram account exists in CSV data
    const found = csvData.has(normalizedAccount);
    
    if (found) {
      const row = csvData.get(normalizedAccount)!;
      return NextResponse.json({
        valid: true,
        message: 'Telegram account verified',
        data: row,
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: 'Telegram account not found in campaign records',
      });
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify user';
    return NextResponse.json(
      { 
        message: 'Failed to verify user', 
        valid: false,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

