import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { getAdminDb } from '@/lib/instantdb';

export const dynamic = 'force-dynamic';

/**
 * Download CSV records for a specific upload
 * GET /api/csv/uploads/[id]/download
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check admin authentication
        const authCheck = await requireAdminAuth(request);
        if (authCheck.error) {
            return authCheck.response;
        }

        const uploadId = params.id;
        const db = getAdminDb();

        // Fetch the upload metadata
        const uploadsQuery = await db.query({
            csv_uploads: {
                $: {
                    where: {
                        id: uploadId,
                    },
                },
            },
        });

        const uploads = uploadsQuery.csv_uploads || [];
        if (uploads.length === 0) {
            return NextResponse.json(
                { message: 'Upload not found' },
                { status: 404 }
            );
        }

        const upload = uploads[0] as { id: string; uploadName: string; fileName: string; uploadedBy: string; uploadedAt: number; recordCount: number };

        // Fetch ALL records for this upload (no pagination)
        const recordsQuery = await db.query({
            csv_records: {
                $: {
                    where: {
                        uploadId: uploadId,
                    },
                },
            },
        });

        const records = recordsQuery.csv_records || [];

        // Generate CSV content
        const csvLines: string[] = [];

        // Header row
        csvLines.push('old username,new username,npub key');

        // Data rows
        for (const record of records) {
            const typedRecord = record as { oldUsername?: string; newUsername?: string; npubKey?: string };
            const oldUsername = escapeCSVField(typedRecord.oldUsername || '');
            const newUsername = escapeCSVField(typedRecord.newUsername || '');
            const npubKey = escapeCSVField(typedRecord.npubKey || '');

            csvLines.push(`${oldUsername},${newUsername},${npubKey}`);
        }

        const csvContent = csvLines.join('\n');

        // Generate filename with upload name and date
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const sanitizedUploadName = upload.uploadName.replace(/[^a-z0-9_-]/gi, '_');
        const filename = `${sanitizedUploadName}_${date}.csv`;

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('CSV download error:', error);
        return NextResponse.json(
            {
                message: 'Failed to download CSV',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Escape CSV field - handle commas, quotes, and newlines
 */
function escapeCSVField(field: string): string {
    if (!field) return '';

    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
}
