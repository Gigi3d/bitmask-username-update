import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseCSV } from '@/lib/utils';
import { getAdminDb } from '@/lib/instantdb';
import { id } from '@instantdb/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (authCheck.error) {
      return authCheck.response;
    }

    const adminEmail = request.headers.get('x-user-email');
    if (!adminEmail) {
      return NextResponse.json(
        { message: 'Admin email required' },
        { status: 400 }
      );
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

    // Read and parse CSV
    const csvContent = await file.text();
    const parsedRows = parseCSV(csvContent);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { message: 'CSV file contains no valid data rows' },
        { status: 400 }
      );
    }

    // Get database instance
    const db = getAdminDb();

    // Delete ALL existing CSV records (since we're not tracking uploadedBy anymore)
    const existingQuery = await db.query({ csv_records: {} });
    const existingRecords = existingQuery?.csv_records
      ? (Array.isArray(existingQuery.csv_records)
        ? existingQuery.csv_records
        : Object.values(existingQuery.csv_records))
      : [];

    if (existingRecords.length > 0) {
      const deleteOps = existingRecords.map((record: any) =>
        db.tx.csv_records[record.id].delete()
      );
      await db.transact(deleteOps);
    }

    // Create new records - match exact schema fields
    const now = Date.now();
    for (const row of parsedRows) {
      const recordId = id();
      // Only use fields that exist in schema: telegramAccount, createdAt, oldUsername, newUsername
      const newRecord = {
        oldUsername: row.oldUsername,
        newUsername: row.newUsername,
        createdAt: now,
        telegramAccount: '', // Required by schema
      };

      await db.transact([
        db.tx.csv_records[recordId].create(newRecord)
      ]);
    }

    return NextResponse.json({
      message: `CSV uploaded successfully. ${parsedRows.length} rows processed.`,
      rowCount: parsedRows.length,
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      {
        message: 'Failed to upload CSV',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
