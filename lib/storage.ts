import { CSVRow, UserUpdateData } from '@/types';

// In-memory storage for CSV data
// In production, replace this with database storage
let csvData: Map<string, CSVRow> = new Map();

// In-memory storage for user updates
// In production, replace this with database storage
let userUpdates: UserUpdateData[] = [];

export function getCSVData(): Map<string, CSVRow> {
  return csvData;
}

export function setCSVData(data: Map<string, CSVRow>): void {
  csvData = data;
}

export function getUserUpdates(): UserUpdateData[] {
  return userUpdates;
}

export function addUserUpdate(update: UserUpdateData): void {
  userUpdates.push(update);
}

