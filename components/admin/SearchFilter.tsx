'use client';

import { useState, useMemo } from 'react';

interface SearchFilterProps<T = Record<string, unknown>> {
    data: T[];
    onFilteredDataChange: (filtered: T[]) => void;
    searchFields: string[];
}

export default function SearchFilter<T extends Record<string, unknown>>({ data, onFilteredDataChange, searchFields }: SearchFilterProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [sortBy, setSortBy] = useState<string>('submittedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Filter and sort data
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                searchFields.some(field =>
                    String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            let cutoff = 0;

            switch (dateFilter) {
                case 'today':
                    cutoff = now - dayMs;
                    break;
                case 'week':
                    cutoff = now - (7 * dayMs);
                    break;
                case 'month':
                    cutoff = now - (30 * dayMs);
                    break;
            }

            filtered = filtered.filter(item => {
                const submittedAt = item.submittedAt;
                return typeof submittedAt === 'number' && submittedAt >= cutoff;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            return sortOrder === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });

        return filtered;
    }, [data, searchTerm, dateFilter, sortBy, sortOrder, searchFields]);

    // Update parent component when filtered data changes
    useMemo(() => {
        onFilteredDataChange(filteredData);
    }, [filteredData, onFilteredDataChange]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Search</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by username, etc..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                    />
                </div>

                {/* Date Filter */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Date Range</label>
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                </div>

                {/* Sort */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Sort By</label>
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                        >
                            <option value="submittedAt">Date</option>
                            <option value="oldUsername">Old Username</option>
                            <option value="newUsername">New Username</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-400">
                Showing {filteredData.length} of {data.length} results
            </div>
        </div>
    );
}
