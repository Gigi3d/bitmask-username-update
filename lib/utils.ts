/**
 * Validation utilities for username and nPUB key inputs
 */

/**
 * Validate username format
 * @param username - Username to validate
 * @returns true if valid, false otherwise
 */
export function validateUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
        return false;
    }
    const trimmed = username.trim();
    return trimmed.length >= 1 && trimmed.length <= 50;
}

/**
 * Normalize Telegram account handle
 * Removes @ symbol and converts to lowercase for consistent lookups
 * @param telegramAccount - Telegram handle to normalize (with or without @)
 * @returns Normalized telegram account (lowercase, no @)
 */
export function normalizeTelegramAccount(telegramAccount: string): string {
    if (!telegramAccount || typeof telegramAccount !== 'string') {
        return '';
    }
    return telegramAccount.toLowerCase().replace('@', '');
}

/**
 * Validate nPUB key format
 * nPUB keys should start with "npub1" and be 63 characters long
 * Example: npub1jlyep8ew8l4gp9vl44dv422czapfeue9s3msxdj6uvnverl3yuyqjs8tqf
 * 
 * @param npubKey - nPUB key to validate
 * @returns true if valid, false otherwise
 */
export function validateNpubKey(npubKey: string): boolean {
    if (!npubKey || typeof npubKey !== 'string') {
        return false;
    }
    const trimmed = npubKey.trim();

    // Check if it starts with "npub1"
    if (!trimmed.startsWith('npub1')) {
        return false;
    }

    // Check if it's exactly 63 characters
    if (trimmed.length !== 63) {
        return false;
    }

    // Check if it only contains valid bech32 characters (lowercase alphanumeric, excluding 1, b, i, o)
    const bech32Regex = /^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/;
    return bech32Regex.test(trimmed);
}

/**
 * Validate either username or nPUB key format
 * @param identifier - Username or nPUB key to validate
 * @returns Object with validation result and detected type
 */
export function validateIdentifier(identifier: string): {
    isValid: boolean;
    type: 'username' | 'npubKey' | 'unknown';
    error?: string;
} {
    if (!identifier || typeof identifier !== 'string') {
        return {
            isValid: false,
            type: 'unknown',
            error: 'Identifier is required',
        };
    }

    const trimmed = identifier.trim();

    // Check if it looks like an nPUB key (starts with "npub1")
    if (trimmed.startsWith('npub1')) {
        const isValid = validateNpubKey(trimmed);
        return {
            isValid,
            type: 'npubKey',
            error: isValid ? undefined : 'Invalid nPUB key format. Must be 63 characters starting with "npub1"',
        };
    }

    // Otherwise, treat it as a username
    const isValid = validateUsername(trimmed);
    return {
        isValid,
        type: 'username',
        error: isValid ? undefined : 'Username must be between 1 and 50 characters',
    };
}

/**
 * Validate Telegram handle format
 * @param handle - Telegram handle to validate (with or without @)
 * @returns true if valid, false otherwise
 */
export function validateTelegramHandle(handle: string): boolean {
    if (!handle || typeof handle !== 'string') {
        return false;
    }

    const trimmed = handle.trim();
    // Remove @ if present
    const cleanHandle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

    // Telegram usernames must be 5-32 characters and can only contain letters, numbers, and underscores
    const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
    return telegramRegex.test(cleanHandle);
}

/**
 * Parse CSV content into CSVRow array
 * Expected columns: old username, telegram account, new username, npub key (optional)
 * @param csvContent - Raw CSV file content as string
 * @returns Array of CSVRow objects
 */
export function parseCSV(csvContent: string): Array<{
    oldUsername: string;
    telegramAccount: string;
    newUsername: string;
    npubKey?: string;
}> {
    if (!csvContent || typeof csvContent !== 'string') {
        throw new Error('CSV content is required');
    }

    // Split into lines (handle different line endings)
    const lines = csvContent.trim().split(/\r?\n|\r/).filter(line => line.trim());

    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header line
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    // Find column indices
    const oldUsernameIndex = headers.findIndex(h =>
        h.includes('old') && h.includes('username')
    );
    const telegramIndex = headers.findIndex(h =>
        h.includes('telegram') || h.includes('tg')
    );
    const newUsernameIndex = headers.findIndex(h =>
        h.includes('new') && h.includes('username')
    );
    const npubKeyIndex = headers.findIndex(h =>
        h.includes('npub') || (h.includes('pub') && h.includes('key'))
    );

    // Validate required columns exist
    if (oldUsernameIndex === -1 || telegramIndex === -1 || newUsernameIndex === -1) {
        throw new Error(
            `CSV must have required columns. Found headers: ${headerLine}\n` +
            `Required: "old username", "telegram account", "new username"\n` +
            `Optional: "npub key"`
        );
    }

    // Parse data rows
    const rows: Array<{
        oldUsername: string;
        telegramAccount: string;
        newUsername: string;
        npubKey?: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',').map(v => v.trim());

        // Get values from columns
        const oldUsername = values[oldUsernameIndex] || '';
        const telegramAccount = values[telegramIndex] || '';
        const newUsername = values[newUsernameIndex] || '';
        const npubKey = npubKeyIndex !== -1 ? values[npubKeyIndex] : undefined;

        // Skip rows where telegram account is empty (required field)
        if (!telegramAccount) {
            continue;
        }

        // Add row (oldUsername can be empty if npubKey is provided)
        if (oldUsername || npubKey) {
            rows.push({
                oldUsername,
                telegramAccount,
                newUsername,
                ...(npubKey && { npubKey }),
            });
        }
    }

    return rows;
}

/**
 * Format timestamp to YYYY-MM-DD date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get the start of the week for a given timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Week start date string (YYYY-MM-DD)
 */
export function getWeekStart(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(date.setDate(diff));
    return formatDate(weekStart.getTime());
}

