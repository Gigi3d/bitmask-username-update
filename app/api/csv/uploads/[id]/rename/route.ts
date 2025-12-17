import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { getAdminDb } from '@/lib/instantdb';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/csv/uploads/[id]/rename
 * Update the name of a CSV upload
 */
export async function PATCH(
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
        const body = await request.json();
        const { uploadName } = body;

        if (!uploadName || typeof uploadName !== 'string' || uploadName.trim() === '') {
            return NextResponse.json(
                { message: 'Upload name is required' },
                { status: 400 }
            );
        }

        // Get database instance
        const db = getAdminDb();

        // Verify upload exists
        const uploadsQuery = await db.query({ csv_uploads: {} });
        const uploadsData = uploadsQuery?.csv_uploads
            ? (Array.isArray(uploadsQuery.csv_uploads)
                ? uploadsQuery.csv_uploads
                : Object.values(uploadsQuery.csv_uploads))
            : [];

        const upload = (uploadsData as Array<{ id: string }>).find((u) => u.id === uploadId);

        if (!upload) {
            return NextResponse.json(
                { message: 'Upload not found' },
                { status: 404 }
            );
        }

        // Update upload name
        await db.transact([
            db.tx.csv_uploads[uploadId].update({
                uploadName: uploadName.trim(),
            })
        ]);

        return NextResponse.json({
            success: true,
            uploadId,
            uploadName: uploadName.trim(),
        });

    } catch (error) {
        console.error('Error renaming upload:', error);
        return NextResponse.json(
            {
                message: 'Failed to rename upload',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
