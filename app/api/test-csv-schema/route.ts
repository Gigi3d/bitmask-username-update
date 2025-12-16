import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/instantdb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminDb();
        const result = await db.query({ csv_records: {} });

        const records = result?.csv_records
            ? (Array.isArray(result.csv_records)
                ? result.csv_records
                : Object.values(result.csv_records))
            : [];

        const sampleRecord = records[0] || null;
        const allFields = sampleRecord ? Object.keys(sampleRecord) : [];

        return NextResponse.json({
            success: true,
            totalRecords: records.length,
            sampleRecord,
            allFields,
            message: 'Use these fields in your CSV upload code',
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
