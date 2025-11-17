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

  // Find column indices with more flexible matching
  const oldUsernameIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return (lower.includes('old') && lower.includes('username')) || 
           lower === 'oldusername' || 
           lower === 'old_username' ||
           lower === 'old-username' ||
           lower === 'oldusername' ||
           lower.includes('oldusername');
  });

  const telegramIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return lower.includes('telegram') || 
           lower.includes('tg') || 
           lower === 'telegramaccount' ||
           lower === 'telegram_account' ||
           lower === 'telegram-account' ||
           lower.includes('telegramaccount');
  });

  // Only oldUsername and telegramAccount are required; newUsername is optional
  if (oldUsernameIdx === -1 || telegramIdx === -1) {
    const missing = [];
    if (oldUsernameIdx === -1) missing.push('old username');
    if (telegramIdx === -1) missing.push('telegram account');
    
    throw new Error(
      `CSV must contain columns: ${missing.join(', ')}. ` +
      `Found headers: ${headers.join(', ')}`
    );
  }

  // newUsername is optional - if column exists, use it; otherwise default to empty
  const newUsernameIdx = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return (lower.includes('new') && lower.includes('username')) || 
           lower === 'newusername' || 
           lower === 'new_username' ||
           lower === 'new-username' ||
           lower === 'newusername' ||
           lower.includes('newusername');
  });

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines
    if (!line) continue;
    
    const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
    
    // Check if we have enough columns for required fields
    const maxRequiredIdx = Math.max(oldUsernameIdx, telegramIdx);
    if (values.length > maxRequiredIdx) {
      const oldUsername = values[oldUsernameIdx]?.trim() || '';
      const telegramAccount = values[telegramIdx]?.trim() || '';
      // newUsername is optional - use it if column exists and has value, otherwise empty string
      const newUsername = newUsernameIdx !== -1 && values.length > newUsernameIdx 
        ? (values[newUsernameIdx]?.trim() || '')
        : '';
      
      // Only require oldUsername and telegramAccount; newUsername can be empty
      if (oldUsername && telegramAccount) {
        rows.push({
          oldUsername,
          telegramAccount,
          newUsername, // Can be empty string
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

