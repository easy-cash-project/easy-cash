/**
 * Background job to update exchange rates every 5 minutes
 * Fetches rates from Rapira API and CoinGecko, then updates the database
 */

import { getDb } from '../db';
import { buildRatesMatrix } from './rates-parser';
import type { ExchangeRate } from './rates-parser';

let updateInterval: NodeJS.Timeout | null = null;
let isUpdating = false;

/**
 * Update all exchange rates in the database
 */
export async function updateExchangeRates(): Promise<void> {
  if (isUpdating) {
    console.log('[RatesUpdater] Update already in progress, skipping...');
    return;
  }

  isUpdating = true;
  const startTime = Date.now();

  try {
    console.log('[RatesUpdater] Starting exchange rates update...');

    // Fetch fresh rates from APIs
    const ratesMatrix = await buildRatesMatrix();
    console.log(`[RatesUpdater] Fetched ${ratesMatrix.total_pairs} rate pairs`);

    // Get database connection
    const db = await getDb();
    if (!db) {
      console.error('[RatesUpdater] Database not available');
      return;
    }

    // Get all currencies from database
    const currencies = await db.query(`
      SELECT id, code FROM currencies
    `);

    const currencyMap = new Map<string, number>();
    currencies.forEach((c: any) => {
      currencyMap.set(c.code, c.id);
    });

    console.log(`[RatesUpdater] Found ${currencyMap.size} currencies in database`);

    // Update rates in database
    let updatedCount = 0;
    let skippedCount = 0;

    for (const rate of ratesMatrix.rates) {
      const fromCurrencyId = currencyMap.get(rate.from);
      const toCurrencyId = currencyMap.get(rate.to);

      if (!fromCurrencyId || !toCurrencyId) {
        skippedCount++;
        continue;
      }

      try {
        // Check if rate exists
        const existing = await db.query(`
          SELECT id FROM exchange_rates 
          WHERE "fromCurrencyId" = $1 AND "toCurrencyId" = $2
        `, [fromCurrencyId, toCurrencyId]);

        if (existing.length > 0) {
          // Update existing rate
          await db.query(`
            UPDATE exchange_rates 
            SET "baseRate" = $1, "updatedAt" = NOW()
            WHERE "fromCurrencyId" = $2 AND "toCurrencyId" = $3
          `, [rate.rate.toString(), fromCurrencyId, toCurrencyId]);
        } else {
          // Insert new rate
          await db.query(`
            INSERT INTO exchange_rates 
            ("fromCurrencyId", "toCurrencyId", "baseRate", "markupPercent", "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
          `, [fromCurrencyId, toCurrencyId, rate.rate.toString(), '0']);
        }

        updatedCount++;
      } catch (error) {
        console.error(`[RatesUpdater] Error updating rate ${rate.from}/${rate.to}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RatesUpdater] Update completed in ${duration}ms: ${updatedCount} updated, ${skippedCount} skipped`);
  } catch (error) {
    console.error('[RatesUpdater] Error during update:', error);
  } finally {
    isUpdating = false;
  }
}

/**
 * Start the background job
 */
export function startRatesUpdater(intervalMs: number = 5 * 60 * 1000): void {
  if (updateInterval) {
    console.log('[RatesUpdater] Already running');
    return;
  }

  console.log(`[RatesUpdater] Starting with interval: ${intervalMs}ms (${intervalMs / 1000 / 60} minutes)`);

  // Update immediately on start
  updateExchangeRates().catch(err => {
    console.error('[RatesUpdater] Initial update failed:', err);
  });

  // Then update periodically
  updateInterval = setInterval(() => {
    updateExchangeRates().catch(err => {
      console.error('[RatesUpdater] Periodic update failed:', err);
    });
  }, intervalMs);
}

/**
 * Stop the background job
 */
export function stopRatesUpdater(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('[RatesUpdater] Stopped');
  }
}

/**
 * Check if updater is running
 */
export function isRatesUpdaterRunning(): boolean {
  return updateInterval !== null;
}
