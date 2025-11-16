import { CSVRow } from '@/types';

/**
 * Parse a single CSV line handling quoted fields and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
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
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

/**
 * Parse CSV file content into array of CSVRow objects
 * Handles quoted fields, escaped quotes, and different line endings
 */
export function parseCSV(csvContent: string): CSVRow[] {
  // Handle different line endings (\r\n, \n, \r)
  const lines = csvContent.trim().split(/\r?\n|\r/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
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
    const line = lines[i].trim();
    // Skip empty lines
    if (!line) continue;
    
    const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
    
    if (values.length > Math.max(oldUsernameIdx, telegramIdx, newUsernameIdx)) {
      const oldUsername = values[oldUsernameIdx]?.trim() || '';
      const telegramAccount = values[telegramIdx]?.trim() || '';
      const newUsername = values[newUsernameIdx]?.trim() || '';
      
      // Only add row if all required fields are present
      if (oldUsername && telegramAccount && newUsername) {
        rows.push({
          oldUsername,
          telegramAccount,
          newUsername,
        });
      }
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
 * Accepts both Date objects and ISO string dates
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get start of week for a given date
 * Accepts both Date objects and ISO string dates
 */
export function getWeekStart(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return formatDate(weekStart);
}

