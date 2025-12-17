import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/instantdb';
import { id } from '@instantdb/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminDb();

        // Try to create a test csv_uploads record
        const testUploadId = id();
        const testUpload = {
            uploadName: 'TEST',
            fileName: 'test.csv',
            uploadedBy: 'test@example.com',
            uploadedAt: Date.now(),
            recordCount: 1,
        };

        console.log('Testing csv_uploads creation...');
        await db.transact([
            db.tx.csv_uploads[testUploadId].update(testUpload)
        ]);
        console.log('✅ csv_uploads works!');

        // Try to create a test csv_records record
        const testRecordId = id();
        const testRecord = {
            oldUsername: 'test@old.com',
            newUsername: 'test@new.com',
            npubKey: 'npub123',
            createdAt: Date.now(),
            uploadId: testUploadId,
            uploadedBy: 'test@example.com',
        };

        console.log('Testing csv_records creation...');
        await db.transact([
            db.tx.csv_records[testRecordId].update(testRecord)
        ]);
        console.log('✅ csv_records works!');

        // Clean up test data
        await db.transact([
            db.tx.csv_uploads[testUploadId].delete(),
            db.tx.csv_records[testRecordId].delete(),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Schema test passed! Both entities work correctly.',
        });

    } catch (error: any) {
        console.error('Schema test error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            hint: error.hint || null,
            body: error.body || null,
            details: 'Check which entity/attribute is causing the issue',
        }, { status: 500 });
    }
}
