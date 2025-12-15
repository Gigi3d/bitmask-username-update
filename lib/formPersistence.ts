/**
 * Form persistence utilities using localStorage
 * Saves and restores form data across page refreshes
 */

const STORAGE_KEY = 'bitmask_update_form_data';
const STORAGE_TIMESTAMP_KEY = 'bitmask_update_form_timestamp';
const EXPIRY_HOURS = 24; // Form data expires after 24 hours

export interface FormData {
    oldUsername: string;
    telegramAccount: string;
    newUsername: string;
    npubKey?: string;
    currentStep: number;
}

/**
 * Save form data to localStorage
 */
export function saveFormData(data: Partial<FormData>): void {
    try {
        const existingData = getFormData();
        const updatedData = { ...existingData, ...data };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving form data:', error);
    }
}

/**
 * Get form data from localStorage
 */
export function getFormData(): Partial<FormData> {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

        if (!data || !timestamp) {
            return {};
        }

        // Check if data has expired
        const savedTime = parseInt(timestamp, 10);
        const now = Date.now();
        const hoursPassed = (now - savedTime) / (1000 * 60 * 60);

        if (hoursPassed > EXPIRY_HOURS) {
            clearFormData();
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        console.error('Error retrieving form data:', error);
        return {};
    }
}

/**
 * Clear form data from localStorage
 */
export function clearFormData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    } catch (error) {
        console.error('Error clearing form data:', error);
    }
}

/**
 * Check if saved form data exists
 */
export function hasSavedFormData(): boolean {
    const data = getFormData();
    return Object.keys(data).length > 0;
}

/**
 * Get time remaining before form data expires
 */
export function getTimeRemaining(): string {
    try {
        const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
        if (!timestamp) return '';

        const savedTime = parseInt(timestamp, 10);
        const now = Date.now();
        const hoursRemaining = EXPIRY_HOURS - (now - savedTime) / (1000 * 60 * 60);

        if (hoursRemaining <= 0) return '';

        if (hoursRemaining < 1) {
            const minutesRemaining = Math.floor(hoursRemaining * 60);
            return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
        }

        const hours = Math.floor(hoursRemaining);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } catch {
        return '';
    }
}
