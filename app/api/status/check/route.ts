import { NextRequest, NextResponse } from 'next/server';
import { getUserUpdates } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trackingId } = body;

        if (!trackingId || typeof trackingId !== 'string') {
            return NextResponse.json(
                { message: 'Tracking ID is required' },
                { status: 400 }
            );
        }

        // Get all user updates
        const updates = await getUserUpdates();

        // Find submission by tracking ID
        // Note: We need to add trackingId to the user_updates schema
        // For now, we'll search by a combination of fields or add it to the schema
        const submission = updates.find((update) => {
            // Temporary: generate tracking ID from submission data
            // In production, this should be stored in the database
            const tempId = `BM-${update.id.substring(0, 7).toUpperCase()}`;
            return tempId === trackingId.toUpperCase();
        });

        if (!submission) {
            return NextResponse.json(
                { message: 'Tracking ID not found. Please check your ID and try again.' },
                { status: 404 }
            );
        }

        // Determine status based on submission time
        // In production, this would be a field in the database
        const now = Date.now();
        const hoursSinceSubmission = (now - submission.submittedAt) / (1000 * 60 * 60);

        let status: 'pending' | 'processing' | 'completed' | 'error' = 'pending';
        if (hoursSinceSubmission > 48) {
            status = 'completed';
        } else if (hoursSinceSubmission > 2) {
            status = 'processing';
        }

        return NextResponse.json({
            submission: {
                oldUsername: submission.oldUsername,
                newUsername: submission.newUsername,
                telegramAccount: submission.telegramAccount,
                submittedAt: submission.submittedAt,
                status,
            },
        });
    } catch (error) {
        console.error('Error checking status:', error);
        return NextResponse.json(
            { message: 'Failed to check status' },
            { status: 500 }
        );
    }
}
