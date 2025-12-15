'use client';

import { useState } from 'react';
import { showToast } from '../Toast';

interface ExportButtonProps {
    data: any[];
    filename: string;
    type: 'csv' | 'json' | 'excel';
}

export default function ExportButton({ data, filename, type }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const exportToCSV = (data: any[]) => {
        if (data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportToJSON = (data: any[]) => {
        if (data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportToExcel = async (data: any[]) => {
        if (data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        // For Excel, we'll use CSV format with .xlsx extension
        // In production, you'd use a library like xlsx or exceljs
        exportToCSV(data);
        showToast('Exported as CSV (Excel-compatible)', 'info');
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            switch (type) {
                case 'csv':
                    exportToCSV(data);
                    showToast('CSV exported successfully', 'success');
                    break;
                case 'json':
                    exportToJSON(data);
                    showToast('JSON exported successfully', 'success');
                    break;
                case 'excel':
                    await exportToExcel(data);
                    break;
            }
        } catch (error) {
            showToast('Export failed', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const getButtonText = () => {
        if (isExporting) return 'Exporting...';
        switch (type) {
            case 'csv':
                return 'Export CSV';
            case 'json':
                return 'Export JSON';
            case 'excel':
                return 'Export Excel';
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="px-4 py-2 bg-accent text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {getButtonText()}
        </button>
    );
}
