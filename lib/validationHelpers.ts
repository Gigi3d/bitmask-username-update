/**
 * Enhanced validation utilities with detailed error messages
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Debounced validation hook
 * @param value - Value to validate
 * @param validationFn - Validation function that returns { isValid, error }
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export function useDebounceValidation<T>(
    value: T,
    validationFn: (val: T) => { isValid: boolean; error?: string },
    delay: number = 300
) {
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        error?: string;
        isValidating: boolean;
    }>({ isValid: true, isValidating: false });

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Don't validate empty values
        if (!value) {
            setValidationResult({ isValid: true, isValidating: false });
            return;
        }

        // Set validating state
        setValidationResult(prev => ({ ...prev, isValidating: true }));

        // Debounce validation
        timeoutRef.current = setTimeout(() => {
            const result = validationFn(value);
            setValidationResult({ ...result, isValidating: false });
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay, validationFn]);

    return validationResult;
}

/**
 * Enhanced validation error messages
 */
export const ValidationErrors = {
    username: {
        empty: 'Username is required',
        tooShort: 'Username must be at least 1 character',
        tooLong: 'Username must be 50 characters or less',
        invalid: 'Username contains invalid characters',
    },
    npubKey: {
        empty: 'nPUB key is required',
        wrongPrefix: 'nPUB key must start with "npub1"',
        wrongLength: 'nPUB key must be exactly 63 characters',
        invalidChars: 'nPUB key contains invalid characters (only lowercase letters and numbers, excluding 1, b, i, o)',
        invalid: 'Invalid nPUB key format',
    },
    identifier: {
        empty: 'Please enter your old username or nPUB key',
        notFound: 'This identifier was not found in our campaign records',
    },
};

/**
 * Enhanced username validation with detailed errors
 */
export function validateUsernameDetailed(username: string): {
    isValid: boolean;
    error?: string;
    suggestions?: string[];
} {
    if (!username || typeof username !== 'string') {
        return {
            isValid: false,
            error: ValidationErrors.username.empty,
        };
    }

    const trimmed = username.trim();

    if (trimmed.length < 1) {
        return {
            isValid: false,
            error: ValidationErrors.username.tooShort,
        };
    }

    if (trimmed.length > 50) {
        return {
            isValid: false,
            error: ValidationErrors.username.tooLong,
            suggestions: ['Try shortening your username', 'Remove extra characters'],
        };
    }

    return { isValid: true };
}

/**
 * Enhanced nPUB key validation with detailed errors
 */
export function validateNpubKeyDetailed(npubKey: string): {
    isValid: boolean;
    error?: string;
    suggestions?: string[];
} {
    if (!npubKey || typeof npubKey !== 'string') {
        return {
            isValid: false,
            error: ValidationErrors.npubKey.empty,
        };
    }

    const trimmed = npubKey.trim();

    if (!trimmed.startsWith('npub1')) {
        return {
            isValid: false,
            error: ValidationErrors.npubKey.wrongPrefix,
            suggestions: ['Make sure your nPUB key starts with "npub1"', 'Check if you copied the full key'],
        };
    }

    if (trimmed.length !== 63) {
        const diff = 63 - trimmed.length;
        return {
            isValid: false,
            error: ValidationErrors.npubKey.wrongLength,
            suggestions: [
                diff > 0
                    ? `Your key is ${Math.abs(diff)} character${Math.abs(diff) !== 1 ? 's' : ''} too short`
                    : `Your key is ${Math.abs(diff)} character${Math.abs(diff) !== 1 ? 's' : ''} too long`,
                'Double-check you copied the complete key',
            ],
        };
    }

    const bech32Regex = /^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/;
    if (!bech32Regex.test(trimmed)) {
        return {
            isValid: false,
            error: ValidationErrors.npubKey.invalidChars,
            suggestions: ['Check for typos or invalid characters', 'nPUB keys should be lowercase'],
        };
    }

    return { isValid: true };
}


