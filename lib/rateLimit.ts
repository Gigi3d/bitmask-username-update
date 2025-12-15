/**
 * Simple rate limiting middleware using in-memory storage
 * For production, use Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Check rate limit for an identifier
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // No entry or expired entry
    if (!entry || entry.resetTime < now) {
        const resetTime = now + config.windowMs;
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime,
        });

        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: resetTime,
        };
    }

    // Entry exists and is valid
    if (entry.count < config.maxRequests) {
        entry.count++;
        rateLimitStore.set(identifier, entry);

        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - entry.count,
            reset: entry.resetTime,
        };
    }

    // Rate limit exceeded
    return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
    };
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
    // Check various headers for IP address
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
    // Strict limit for form submissions
    formSubmission: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },

    // Moderate limit for verification endpoints
    verification: {
        maxRequests: 10,
        windowMs: 5 * 60 * 1000, // 5 minutes
    },

    // Lenient limit for status checks
    statusCheck: {
        maxRequests: 20,
        windowMs: 60 * 1000, // 1 minute
    },

    // Very strict for CSV uploads (admin only)
    csvUpload: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
    },
};
