/**
 * Shared API helper utilities for consistent error handling and responses
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response with development/production logging
 * @param error - Error object or message
 * @param status - HTTP status code (default: 500)
 * @param userMessage - User-friendly error message
 * @returns NextResponse with error details
 */
export function handleApiError(
    error: unknown,
    status: number = 500,
    userMessage?: string
): NextResponse {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', error);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const message = userMessage || errorMessage;

    return NextResponse.json(
        {
            message,
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status }
    );
}

/**
 * Create a success response with optional data
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success data
 */
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Create cache control headers for read-only endpoints
 * @param maxAge - Cache max age in seconds (default: 60)
 * @param staleWhileRevalidate - Stale-while-revalidate time in seconds (default: 300)
 * @returns Headers object with cache control
 */
export function createCacheHeaders(
    maxAge: number = 60,
    staleWhileRevalidate: number = 300
): HeadersInit {
    return {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    };
}

/**
 * Validate request body has required fields
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateRequestBody(
    body: any,
    requiredFields: string[]
): { isValid: boolean; error?: string; missingFields?: string[] } {
    if (!body || typeof body !== 'object') {
        return {
            isValid: false,
            error: 'Invalid request body',
        };
    }

    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            missingFields,
        };
    }

    return { isValid: true };
}

/**
 * Create a validation error response
 * @param message - Validation error message
 * @returns NextResponse with 400 status
 */
export function createValidationError(message: string): NextResponse {
    return NextResponse.json({ message }, { status: 400 });
}

/**
 * Create a not found error response
 * @param message - Not found error message
 * @returns NextResponse with 404 status
 */
export function createNotFoundError(message: string): NextResponse {
    return NextResponse.json({ message }, { status: 404 });
}

/**
 * Create a conflict error response (for duplicates)
 * @param message - Conflict error message
 * @returns NextResponse with 409 status
 */
export function createConflictError(message: string): NextResponse {
    return NextResponse.json({ message }, { status: 409 });
}
