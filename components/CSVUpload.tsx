'use client';

import { useState } from 'react';
import { db } from '@/lib/instantdb';

export default function CSVUpload() {
  const { user } = db.useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [warning, setWarning] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);

    try {
      if (!user?.email) {
        setError('User email not available. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload CSV');
      }

      setSuccess(true);
      setRowCount(data.rowCount || null);
      
      // Check if message contains warning about duplicates
      if (data.message && data.message.includes('Warning:')) {
        setWarning(data.message);
      } else {
        setWarning('');
      }
      
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Upload CSV</h2>
      <p className="text-gray-400 mb-6 text-sm">
        Upload a CSV file with columns: old username, telegram account, new username
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="csv-file"
            className="block text-sm font-semibold mb-2"
          >
            Select CSV File
          </label>
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-black hover:file:opacity-90"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-300">
            Selected: <span className="font-semibold">{file.name}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-400 text-sm">
            CSV uploaded successfully! {rowCount !== null && `${rowCount} rows processed.`}
          </div>
        )}

        {warning && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-400 text-sm">
            {warning}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-accent text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>
    </div>
  );
}

