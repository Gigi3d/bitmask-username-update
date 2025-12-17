import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { getAdminDb } from '@/lib/instantdb';
import { paginateArray, getPaginationMetadata } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csv/uploads/[id]?page=1&limit=1000
 * Fetch paginated records for a specific upload
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin authentication
        const authCheck = await requireAdminAuth(request);
        if (authCheck.error) {
            return authCheck.response;
        }

        const { id: uploadId } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '1000', 10);

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 10000) {
            return NextResponse.json(
                { message: 'Invalid pagination parameters' },
                { status: 400 }
            );
        }

        // Get database instance
        const db = getAdminDb();

        // Query the upload metadata
        const uploadsQuery = await db.query({ csv_uploads: {} });
        const uploadsData = uploadsQuery?.csv_uploads
            ? (Array.isArray(uploadsQuery.csv_uploads)
                ? uploadsQuery.csv_uploads
                : Object.values(uploadsQuery.csv_uploads))
            : [];

        const upload = (uploadsData as Array<{
            id: string;
            uploadName: string;
            fileName: string;
            uploadedBy: string;
            uploadedAt: number;
            recordCount: number;
        }>).find((u) => u.id === uploadId);

        if (!upload) {
            return NextResponse.json(
                { message: 'Upload not found' },
                { status: 404 }
            );
        }

        // Query all records for this upload
        const recordsQuery = await db.query({ csv_records: {} });
        const allRecords = recordsQuery?.csv_records
            ? (Array.isArray(recordsQuery.csv_records)
                ? recordsQuery.csv_records
                : Object.values(recordsQuery.csv_records))
            : [];

        // Filter records by uploadId
        const uploadRecords = (allRecords as Array<{
            id: string;
            oldUsername: string;
            newUsername: string;
            npubKey?: string;
            createdAt: number;
            uploadId: string;
            uploadedBy?: string;
        }>).filter((record) => record.uploadId === uploadId);

        // Sort by creation date (newest first)
        const sortedRecords = uploadRecords.sort((a, b) => b.createdAt - a.createdAt);

        // Paginate records
        const paginatedRecords = paginateArray(sortedRecords, page, limit);
        const pagination = getPaginationMetadata(sortedRecords.length, page, limit);

        return NextResponse.json({
            uploadId: upload.id,
            uploadName: upload.uploadName,
            fileName: upload.fileName,
            uploadedBy: upload.uploadedBy,
            uploadedAt: upload.uploadedAt,
            records: paginatedRecords,
            pagination,
        });

    } catch (error) {
        console.error('Error fetching upload records:', error);
        return NextResponse.json(
            {
                message: 'Failed to fetch upload records',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
