/**
 * Input sanitization utility for security
 * Removes potentially harmful content from user inputs
 */

/**
 * Sanitize string input by removing HTML tags and special characters
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Sanitize username (alphanumeric, dots, hyphens, underscores, @)
 */
export function sanitizeUsername(username: string): string {
    if (!username || typeof username !== 'string') return '';

    // Allow alphanumeric, dots, hyphens, underscores, @
    const sanitized = username.replace(/[^a-zA-Z0-9._@-]/g, '');

    return sanitized.trim();
}

/**
 * Sanitize nPUB key (alphanumeric lowercase only)
 */
export function sanitizeNpubKey(npubKey: string): string {
    if (!npubKey || typeof npubKey !== 'string') return '';

    // Allow only lowercase alphanumeric (bech32 charset)
    const sanitized = npubKey.toLowerCase().replace(/[^a-z0-9]/g, '');

    return sanitized.trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    // Basic email sanitization
    const sanitized = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
        return '';
    }

    return sanitized;
}

/**
 * Prevent SQL injection by escaping special characters
 * Note: InstantDB handles this automatically, but good to have
 */
export function escapeSql(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/'/g, "''")
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    sanitizeFn: (value: string) => string = sanitizeString
): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeFn(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>, sanitizeFn);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Validate and sanitize tracking ID
 */
export function sanitizeTrackingId(trackingId: string): string {
    if (!trackingId || typeof trackingId !== 'string') return '';

    // Tracking IDs should be: BM-{alphanumeric}-{alphanumeric}
    const sanitized = trackingId.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    return sanitized.trim();
}
