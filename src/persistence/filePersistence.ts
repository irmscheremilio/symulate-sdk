import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../config';

const DEFAULT_FILE_NAME = '.symulate-data.json';

/**
 * Get file path for persistence
 */
function getFilePath(): string {
  const config = getConfig();
  return config.collections?.persistence?.filePath || DEFAULT_FILE_NAME;
}

/**
 * Load all collection data from file
 */
async function loadAllData(): Promise<Record<string, any[]>> {
  const filePath = getFilePath();

  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load data from ${filePath}:`, error);
    return {};
  }
}

/**
 * Save all collection data to file
 */
async function saveAllData(data: Record<string, any[]>): Promise<void> {
  const filePath = getFilePath();

  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Failed to save data to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load data for specific collection
 */
export async function loadFromFile<T>(collectionName: string): Promise<T[] | null> {
  const allData = await loadAllData();
  return allData[collectionName] || null;
}

/**
 * Save data for specific collection
 */
export async function saveToFile<T>(collectionName: string, data: T[]): Promise<void> {
  const allData = await loadAllData();
  allData[collectionName] = data;
  await saveAllData(allData);
}

/**
 * Delete data for specific collection
 */
export async function deleteFromFile(collectionName: string): Promise<void> {
  const allData = await loadAllData();
  delete allData[collectionName];
  await saveAllData(allData);
}

/**
 * Clear all persisted data
 */
export async function clearFile(): Promise<void> {
  const filePath = getFilePath();

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to clear ${filePath}:`, error);
  }
}
