/**
 * Pagination utility functions for handling paginated data
 */

export interface PaginationMetadata {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Paginate an array of items
 * @param items - Array of items to paginate
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Paginated items
 */
export function paginateArray<T>(items: T[], page: number, limit: number): T[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return items.slice(startIndex, endIndex);
}

/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Pagination metadata
 */
export function getPaginationMetadata(
    total: number,
    page: number,
    limit: number
): PaginationMetadata {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));

    return {
        currentPage,
        totalPages,
        totalRecords: total,
        recordsPerPage: limit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
    };
}
