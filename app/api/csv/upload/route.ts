import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/utils';
import { CSVRow } from '@/types';
import { getCSVData, setCSVData } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    
    // Parse CSV
    let rows: CSVRow[];
    try {
      rows = parseCSV(text);
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }

    // Store in memory (keyed by telegram account for easy lookup)
    // In production, store in database
    const csvData = new Map<string, CSVRow>();
    const duplicates: string[] = [];
    
    rows.forEach(row => {
      const key = row.telegramAccount.toLowerCase().replace('@', '');
      if (csvData.has(key)) {
        duplicates.push(key);
      }
      csvData.set(key, row);
    });

    setCSVData(csvData);

    const response: { message: string; rowCount: number; duplicates?: number } = {
      message: 'CSV uploaded successfully',
      rowCount: rows.length,
    };

    if (duplicates.length > 0) {
      response.message += `. Warning: ${duplicates.length} duplicate Telegram account(s) found. Only the last entry for each account was kept.`;
      // Note: In production, you might want to return the duplicates list
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      { message: 'Failed to upload CSV' },
      { status: 500 }
    );
  }
}

