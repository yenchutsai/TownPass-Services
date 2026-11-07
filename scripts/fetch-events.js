/**
 * Scheduled/build script to fetch latest BOLA Taipei OpenData events
 * Usage: node scripts/fetch-events.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../src/data/bola-events.json');

const BOLA_RSS_URL =
  'https://bola.gov.taipei/OpenData.aspx?SN=B475EA5A93126B2E';

async function updateEvents() {
  console.log('Fetching latest events from BOLA open data...');
  try {
    const res = await fetch(BOLA_RSS_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const xml = await res.text();
    console.log(`Successfully fetched XML feed (${xml.length} bytes).`);
    console.log(`Data file located at: ${DATA_PATH}`);
  } catch (err) {
    console.error('Failed to update events:', err.message);
  }
}

updateEvents();

