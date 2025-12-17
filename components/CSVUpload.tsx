'use client';

import { useState } from 'react';
import { db } from '@/lib/instantdb';

export default function CSVUpload() {
  const { user } = db.useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [warning, setWarning] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setWarning('');
    setUploadProgress(0);

    try {
      if (!user?.email) {
        setError('User email not available. Please log in again.');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      if (uploadName.trim()) {
        formData.append('uploadName', uploadName.trim());
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      const promise = new Promise<Response>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          // Parse headers
          const headers: Record<string, string> = {};
          xhr.getAllResponseHeaders().split('\r\n').forEach((line) => {
            const [key, value] = line.split(': ');
            if (key) headers[key] = value;
          });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(headers)
          });

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            // Try to parse error message from response
            try {
              const errorData = JSON.parse(xhr.responseText);
              const errorMessage = errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`;
              const errorDetails = errorData.details ? `\n\n${errorData.details}` : '';
              reject(new Error(errorMessage + errorDetails));
            } catch {
              // If JSON parsing fails, use status text
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText || 'Bad Request'}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/csv/upload');
        if (user?.email) {
          xhr.setRequestHeader('x-user-email', user.email);
        }
        xhr.send(formData);
      });

      const response = await promise;
      const data = await response.json();

      if (!response.ok) {
        // Include details if available
        const errorMsg = data.message || 'Failed to upload CSV';
        const errorDetails = data.details ? `\n\n${data.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      setUploadProgress(100);
      setSuccess(true);
      setRowCount(data.rowCount || null);

      // Check if message contains warning about duplicates
      if (data.message && data.message.includes('Warning:')) {
        setWarning(data.message);
      } else {
        setWarning('');
      }

      setFile(null);
      setUploadName('');

      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Reset progress after a moment
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Upload CSV</h2>
      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-2">
          Upload a CSV file with the following columns:
        </p>
        <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><span className="font-semibold text-white">old username</span> - User&apos;s old Bitmask username</li>
          <li><span className="font-semibold text-white">new username</span> - User&apos;s new username</li>
          <li><span className="font-semibold text-accent">npub key</span> <span className="text-gray-500">(optional)</span> - User&apos;s nPUB key as alternative identifier</li>
        </ul>
        <p className="text-gray-500 text-xs mt-3">
          Note: Either &quot;old username&quot; or &quot;npub key&quot; must be provided for each row.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="upload-name"
            className="block text-sm font-semibold mb-2"
          >
            Upload Name (Optional)
          </label>
          <input
            type="text"
            id="upload-name"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g., December 2025 Batch"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
          />
          <p className="text-gray-500 text-xs mt-1">
            If not provided, the filename will be used
          </p>
        </div>

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
            <div className="whitespace-pre-wrap break-words">{error}</div>
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

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className="bg-accent h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
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

