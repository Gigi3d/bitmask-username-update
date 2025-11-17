import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseCSV } from '@/lib/utils';
import { setCSVData } from '@/lib/storage';
import { CSVRow } from '@/types';

/**
 * API route to upload and process CSV file
 * Requires admin authentication
 * 
 * POST /api/csv/upload
 * Body: multipart/form-data with 'file' field containing CSV file
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (authCheck.error) {
      return authCheck.response;
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { message: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    // Read file content
    let csvContent: string;
    try {
      csvContent = await file.text();
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        { message: 'Failed to read file content' },
        { status: 400 }
      );
    }

    // Log CSV file details for debugging
    console.log('📄 CSV file received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      contentLength: csvContent.length,
      first100Chars: csvContent.substring(0, 100)
    });

    // Parse CSV
    let parsedRows: CSVRow[];
    try {
      parsedRows = parseCSV(csvContent);
      console.log('✅ CSV parsed successfully:', {
        rowCount: parsedRows.length,
        sampleRow: parsedRows[0] || null
      });
    } catch (error) {
      console.error('❌ Error parsing CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid CSV format';
      
      // Provide more helpful error message
      let detailedError = errorMessage;
      if (errorMessage.includes('columns')) {
        const lines = csvContent.trim().split(/\r?\n|\r/);
        const headers = lines[0] || '';
        detailedError = `${errorMessage}\n\nFound headers: ${headers}\n\nExpected headers should include:\n- A column with "old" and "username"\n- A column with "telegram" or "tg"\n- A column with "new" and "username"`;
      }
      
      return NextResponse.json(
        { 
          message: `CSV parsing error: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? detailedError : undefined
        },
        { status: 400 }
      );
    }

    if (parsedRows.length === 0) {
      // Log more details about why no rows were parsed
      const lines = csvContent.trim().split(/\r?\n|\r/).filter(line => line.trim());
      console.error('❌ No valid rows found:', {
        totalLines: lines.length,
        headerLine: lines[0],
        firstDataLine: lines[1],
        allLines: lines.slice(0, 5)
      });
      
      return NextResponse.json(
        { 
          message: 'CSV file contains no valid data rows',
          details: process.env.NODE_ENV === 'development' 
            ? `Found ${lines.length} lines. Make sure:\n1. Headers match expected format\n2. Data rows have all required fields filled\n3. No empty rows between data`
            : undefined
        },
        { status: 400 }
      );
    }

    // Convert to Map format (keyed by normalized telegram account)
    const csvDataMap = new Map<string, CSVRow>();
    const duplicateAccounts: string[] = [];

    for (const row of parsedRows) {
      // Normalize telegram account (lowercase, remove @)
      const normalizedAccount = row.telegramAccount.toLowerCase().replace('@', '');
      
      // Check for duplicates
      if (csvDataMap.has(normalizedAccount)) {
        duplicateAccounts.push(row.telegramAccount);
      }
      
      csvDataMap.set(normalizedAccount, row);
    }

    // Store in InstantDB
    try {
      await setCSVData(csvDataMap);
    } catch (error) {
      console.error('Error storing CSV data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to store CSV data';
      return NextResponse.json(
        { 
          message: 'Failed to store CSV data',
          error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

    // Build response message
    let message = `CSV uploaded successfully. ${csvDataMap.size} rows processed.`;
    if (duplicateAccounts.length > 0) {
      message += ` Warning: ${duplicateAccounts.length} duplicate telegram account(s) found: ${duplicateAccounts.slice(0, 5).join(', ')}${duplicateAccounts.length > 5 ? '...' : ''}. Only the last occurrence was kept.`;
    }

    return NextResponse.json({
      message,
      rowCount: csvDataMap.size,
      ...(duplicateAccounts.length > 0 && { 
        warnings: `Warning: ${duplicateAccounts.length} duplicate telegram account(s) found. Only the last occurrence was kept.`
      })
    });
  } catch (error) {
    console.error('Unexpected error in CSV upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { 
        message: 'Failed to upload CSV',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

