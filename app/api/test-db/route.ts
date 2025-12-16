import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/instantdb';
import { id } from '@instantdb/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const db = getAdminDb();

        // Try to query csv_records
        const result = await db.query({ csv_records: {} });

        return NextResponse.json({
            success: true,
            message: 'InstantDB connection working',
            recordCount: result?.csv_records ? (Array.isArray(result.csv_records) ? result.csv_records.length : Object.keys(result.csv_records).length) : 0,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const db = getAdminDb();
        const recordId = id();

        // Try to create a simple test record
        await db.transact([
            db.tx.csv_records[recordId].create({
                oldUsername: 'test@example.com',
                newUsername: 'newtest@example.com',
                createdAt: Date.now(),
                uploadedBy: 'test@admin.com',
            })
        ]);

        return NextResponse.json({
            success: true,
            message: 'Test record created successfully',
            recordId,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
