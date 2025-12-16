import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseCSV } from '@/lib/utils';
import { setCSVData } from '@/lib/storage';
import { CSVRow } from '@/types';
import { handleApiError, createValidationError } from '@/lib/apiHelpers';

/**
 * API route to upload and process CSV file
 * Requires admin authentication
 * 
 * POST /api/csv/upload
 * Body: multipart/form-data with 'file' field containing CSV file
 */

// Force dynamic rendering since this endpoint writes data and requires auth
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (authCheck.error) {
      return authCheck.response;
    }

    // Get admin email from header (set by client)
    const adminEmail = request.headers.get('x-user-email');
    if (!adminEmail) {
      return createValidationError('Admin email not provided in x-user-email header');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createValidationError('No file provided');
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return createValidationError('File must be a CSV file');
    }

    // Read file content
    let csvContent: string;
    try {
      csvContent = await file.text();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reading file:', error);
      }
      return NextResponse.json(
        { message: 'Failed to read file content' },
        { status: 400 }
      );
    }

    // Log CSV file details for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 CSV file received:', {
        name: file.name,
        size: file.size,
        type: file.type,
        contentLength: csvContent.length,
        first100Chars: csvContent.substring(0, 100)
      });
    }

    // Parse CSV
    let parsedRows: CSVRow[];
    try {
      parsedRows = parseCSV(csvContent);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ CSV parsed successfully:', {
          rowCount: parsedRows.length,
          sampleRow: parsedRows[0] || null
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error parsing CSV:', error);
      }
      const errorMessage = error instanceof Error ? error.message : 'Invalid CSV format';

      // Provide more helpful error message
      let detailedError = errorMessage;
      if (errorMessage.includes('columns')) {
        const lines = csvContent.trim().split(/\r?\n|\r/);
        const headers = lines[0] || '';
        detailedError = `${errorMessage}\n\nFound headers: ${headers}\n\nExpected headers should include:\n- A column with "old" and "username"\n- A column with "new" and "username"`;
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
      // Log more details about why no rows were parsed (development only)
      const lines = csvContent.trim().split(/\r?\n|\r/).filter(line => line.trim());
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ No valid rows found:', {
          totalLines: lines.length,
          headerLine: lines[0],
          firstDataLine: lines[1],
          allLines: lines.slice(0, 5)
        });
      }

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

    // Convert to Map format (keyed by oldUsername)
    const csvDataMap = new Map<string, CSVRow>();
    const duplicateUsernames: string[] = [];

    for (const row of parsedRows) {
      // Use oldUsername as key (lowercase for consistency)
      const key = row.oldUsername.toLowerCase();

      // Check for duplicates
      if (csvDataMap.has(key)) {
        duplicateUsernames.push(row.oldUsername);
      }

      csvDataMap.set(key, row);
    }

    // Store in InstantDB with admin email for scoping
    try {
      await setCSVData(csvDataMap, adminEmail);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error storing CSV data:', error);
      }
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
    if (duplicateUsernames.length > 0) {
      message += ` Warning: ${duplicateUsernames.length} duplicate username(s) found: ${duplicateUsernames.slice(0, 5).join(', ')}${duplicateUsernames.length > 5 ? '...' : ''}. Only the last occurrence was kept.`;
    }

    return NextResponse.json({
      message,
      rowCount: csvDataMap.size,
      ...(duplicateUsernames.length > 0 && {
        warnings: `Warning: ${duplicateUsernames.length} duplicate username(s) found. Only the last occurrence was kept.`
      })
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return handleApiError(error, 500, 'Failed to upload CSV');
  }
}
