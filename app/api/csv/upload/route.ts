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
    const uploadName = formData.get('uploadName') as string | null;

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
    const now = Date.now();

    // Create csv_uploads record first
    const uploadId = id();
    const uploadRecord = {
      uploadName: uploadName || file.name.replace('.csv', ''),
      fileName: file.name,
      uploadedBy: adminEmail,
      uploadedAt: now,
      recordCount: parsedRows.length,
    };

    await db.transact([
      db.tx.csv_uploads[uploadId].update(uploadRecord)
    ]);

    // Create csv_records linked to this upload
    const recordTransactions = parsedRows.map((row) => {
      const recordId = id();
      return db.tx.csv_records[recordId].update({
        oldUsername: row.oldUsername,
        newUsername: row.newUsername,
        npubKey: row.npubKey,
        createdAt: now,
        uploadId: uploadId,
        uploadedBy: adminEmail,
      });
    });

    await db.transact(recordTransactions);

    return NextResponse.json({
      message: `CSV uploaded successfully. ${parsedRows.length} rows processed.`,
      rowCount: parsedRows.length,
      uploadId: uploadId,
      uploadName: uploadRecord.uploadName,
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
