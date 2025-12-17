import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { getAdminDb } from '@/lib/instantdb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csv/uploads
 * Fetch all CSV uploads with metadata
 */
export async function GET(request: NextRequest) {
    try {
        // Check admin authentication
        const authCheck = await requireAdminAuth(request);
        if (authCheck.error) {
            return authCheck.response;
        }

        // Get database instance
        const db = getAdminDb();

        // Query all uploads
        const uploadsQuery = await db.query({ csv_uploads: {} });
        const uploadsData = uploadsQuery?.csv_uploads
            ? (Array.isArray(uploadsQuery.csv_uploads)
                ? uploadsQuery.csv_uploads
                : Object.values(uploadsQuery.csv_uploads))
            : [];

        // Sort by upload date (newest first)
        const sortedUploads = (uploadsData as Array<{
            id: string;
            uploadName: string;
            fileName: string;
            uploadedBy: string;
            uploadedAt: number;
            recordCount: number;
        }>).sort((a, b) => b.uploadedAt - a.uploadedAt);

        return NextResponse.json({
            uploads: sortedUploads,
        });

    } catch (error) {
        console.error('Error fetching uploads:', error);
        return NextResponse.json(
            {
                message: 'Failed to fetch uploads',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
