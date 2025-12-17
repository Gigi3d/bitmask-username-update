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
 * Normalize Bitmask username for comparison
 * Handles both formats: "username" and "username@bitmask.app"
 * @param username - Username to normalize
 * @returns Normalized username (without @bitmask.app suffix)
 */
export function normalizeBitmaskUsername(username: string): string {
    if (!username) return '';
    const trimmed = username.trim().toLowerCase();
    // Remove @bitmask.app suffix if present
    return trimmed.replace(/@bitmask\.app$/i, '');
}

/**
 * Check if two usernames match (flexible matching)
 * Supports both "username" and "username@bitmask.app" formats
 * @param username1 - First username
 * @param username2 - Second username
 * @returns true if usernames match (ignoring @bitmask.app)
 */
export function usernamesMatch(username1: string, username2: string): boolean {
    return normalizeBitmaskUsername(username1) === normalizeBitmaskUsername(username2);
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
 * Parse CSV content into CSVRow array
 * Expected columns: old username, new username, npub key (optional)
 * @param csvContent - Raw CSV file content as string
 * @returns Array of CSVRow objects
 */
export function parseCSV(csvContent: string): Array<{
    oldUsername: string;
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
    const newUsernameIndex = headers.findIndex(h =>
        h.includes('new') && h.includes('username')
    );
    const npubKeyIndex = headers.findIndex(h =>
        h.includes('npub') || (h.includes('pub') && h.includes('key'))
    );

    // Validate required columns exist
    if (oldUsernameIndex === -1 || newUsernameIndex === -1) {
        throw new Error(
            `CSV must have required columns. Found headers: ${headerLine}\n` +
            `Required: "old username", "new username"\n` +
            `Optional: "npub key"`
        );
    }

    // Parse data rows with proper CSV handling (RFC 4180)
    const rows: Array<{
        oldUsername: string;
        newUsername: string;
        npubKey?: string;
    }> = [];

    let skippedEmptyLines = 0;
    let skippedMissingOldUsername = 0;

    // Helper function to parse a CSV line properly (handles quotes and commas)
    function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Add last field
        result.push(current.trim());
        return result;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            skippedEmptyLines++;
            continue; // Skip empty lines
        }

        const values = parseCSVLine(line);

        // Get values from columns
        const oldUsername = values[oldUsernameIndex] || '';
        let newUsername = values[newUsernameIndex] || '';
        const npubKey = npubKeyIndex !== -1 ? values[npubKeyIndex] : undefined;

        // If newUsername is empty, use oldUsername as newUsername (or empty if no oldUsername)
        if (!newUsername) {
            newUsername = oldUsername || '';
        }

        // Add row - accept all records regardless of content
        rows.push({
            oldUsername,
            newUsername,
            ...(npubKey && { npubKey }),
        });
    }

    console.log(`CSV Parsing Summary:`);
    console.log(`  Total lines in file: ${lines.length}`);
    console.log(`  Header lines: 1`);
    console.log(`  Data lines: ${lines.length - 1}`);
    console.log(`  Empty lines skipped: ${skippedEmptyLines}`);
    console.log(`  Missing both oldUsername and npubKey: ${skippedMissingOldUsername}`);
    console.log(`  Valid rows parsed: ${rows.length}`);

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

