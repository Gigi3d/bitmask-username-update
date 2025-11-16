import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseCSV } from '@/lib/utils';
import { setCSVData, getCSVData } from '@/lib/storage';
import { CSVRow } from '@/types';

/**
 * API route to upload CSV file with campaign data
 * Requires admin authentication
 * 
 * POST /api/csv/upload
 * Content-Type: multipart/form-data
 * Headers: x-user-email (for admin auth)
 * Body: FormData with 'file' field containing CSV file
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.response;
    }

    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { message: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    let csvRows: CSVRow[];
    try {
      csvRows = parseCSV(fileContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV';
      return NextResponse.json(
        { message: `CSV parsing error: ${errorMessage}` },
        { status: 400 }
      );
    }

    if (csvRows.length === 0) {
      return NextResponse.json(
        { message: 'CSV file is empty or contains no valid rows' },
        { status: 400 }
      );
    }

    // Check for duplicates within the uploaded file
    const seenAccounts = new Set<string>();
    const duplicates: string[] = [];
    const uniqueRows: CSVRow[] = [];

    for (const row of csvRows) {
      const normalizedAccount = row.telegramAccount.toLowerCase().replace('@', '');
      if (seenAccounts.has(normalizedAccount)) {
        duplicates.push(row.telegramAccount);
      } else {
        seenAccounts.add(normalizedAccount);
        uniqueRows.push(row);
      }
    }

    // Get existing CSV data to check for duplicates
    let existingData: Map<string, CSVRow>;
    try {
      existingData = await getCSVData();
    } catch (error) {
      // If we can't get existing data, proceed anyway (might be first upload)
      console.warn('Could not fetch existing CSV data:', error);
      existingData = new Map();
    }

    // Check for duplicates with existing data
    const existingDuplicates: string[] = [];
    const newRows: CSVRow[] = [];

    for (const row of uniqueRows) {
      const normalizedAccount = row.telegramAccount.toLowerCase().replace('@', '');
      if (existingData.has(normalizedAccount)) {
        existingDuplicates.push(row.telegramAccount);
      } else {
        newRows.push(row);
      }
    }

    // Convert all unique rows (including existing ones) to a Map for storage
    // We'll replace all existing data with the new upload
    const csvDataMap = new Map<string, CSVRow>();
    for (const row of uniqueRows) {
      const normalizedAccount = row.telegramAccount.toLowerCase().replace('@', '');
      csvDataMap.set(normalizedAccount, row);
    }

    // Save to InstantDB (this replaces all existing records)
    await setCSVData(csvDataMap);

    // Build response message
    let message = `CSV uploaded successfully. ${uniqueRows.length} rows processed.`;
    const warnings: string[] = [];

    if (duplicates.length > 0) {
      warnings.push(`Warning: ${duplicates.length} duplicate entries found within the file and removed.`);
    }

    if (existingDuplicates.length > 0) {
      warnings.push(`Warning: ${existingDuplicates.length} entries already existed in the database and were updated.`);
    }

    if (warnings.length > 0) {
      message = `${message} ${warnings.join(' ')}`;
    }

    return NextResponse.json({
      message,
      rowCount: uniqueRows.length,
      newRows: newRows.length,
      updatedRows: existingDuplicates.length,
      duplicateRowsInFile: duplicates.length,
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload CSV';
    return NextResponse.json(
      { 
        message: 'Failed to upload CSV',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

