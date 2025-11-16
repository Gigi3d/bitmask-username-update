import { CSVRow } from '@/types';

/**
 * Parse CSV file content into array of CSVRow objects
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Find column indices
  const oldUsernameIdx = headers.findIndex(h => 
    h.includes('old') && h.includes('username')
  );
  const telegramIdx = headers.findIndex(h => 
    h.includes('telegram') || h.includes('tg')
  );
  const newUsernameIdx = headers.findIndex(h => 
    h.includes('new') && h.includes('username')
  );

  if (oldUsernameIdx === -1 || telegramIdx === -1 || newUsernameIdx === -1) {
    throw new Error('CSV must contain columns: old username, telegram account, new username');
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length >= 3) {
      rows.push({
        oldUsername: values[oldUsernameIdx],
        telegramAccount: values[telegramIdx],
        newUsername: values[newUsernameIdx],
      });
    }
  }

  return rows;
}

/**
 * Validate username format (basic validation)
 */
export function validateUsername(username: string): boolean {
  return username.length > 0 && username.length <= 50;
}

/**
 * Validate Telegram handle format
 */
export function validateTelegramHandle(handle: string): boolean {
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  // Telegram handles: 5-32 characters, alphanumeric and underscores
  return /^[a-zA-Z0-9_]{5,32}$/.test(cleanHandle);
}

/**
 * Format date for analytics display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get start of week for a given date
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return formatDate(weekStart);
}

