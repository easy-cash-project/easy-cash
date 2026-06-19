/**
 * Background job to update exchange rates every 5 minutes
 * Fetches rates from Rapira API and CoinGecko, then updates the database
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { currencies, exchangeRates } from '../../drizzle/schema';
import { buildRatesMatrix } from './rates-parser';

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

    // Get all currencies from database using Drizzle ORM
    const allCurrencies = await db.select({ id: currencies.id, code: currencies.code }).from(currencies);

    const currencyMap = new Map<string, number>();
    allCurrencies.forEach((c) => {
      currencyMap.set(c.code, c.id);
    });

    console.log(`[RatesUpdater] Found ${currencyMap.size} currencies in database`);

    // Update rates in database
    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const rate of ratesMatrix.rates) {
      const fromCurrencyId = currencyMap.get(rate.from);
      const toCurrencyId = currencyMap.get(rate.to);

      if (!fromCurrencyId || !toCurrencyId) {
        skippedCount++;
        continue;
      }

      try {
        // Check if rate exists using Drizzle ORM
        const existing = await db.select().from(exchangeRates)
          .where(and(
            eq(exchangeRates.fromCurrencyId, fromCurrencyId),
            eq(exchangeRates.toCurrencyId, toCurrencyId)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Update existing rate - preserve markup, min/max
          await db.update(exchangeRates)
            .set({ baseRate: rate.rate.toString(), updatedAt: new Date() })
            .where(and(
              eq(exchangeRates.fromCurrencyId, fromCurrencyId),
              eq(exchangeRates.toCurrencyId, toCurrencyId)
            ));
          updatedCount++;
        } else {
          // Insert new rate with default markup based on currency pair
          let defaultMarkup = '0';
          const fromCode = rate.from;
          const toCode = rate.to;

          // 20% for RUB pairs, 3% for crypto pairs
          if (fromCode === 'RUB' || toCode === 'RUB') {
            defaultMarkup = '20';
          } else {
            defaultMarkup = '3';
          }

          await db.insert(exchangeRates).values({
            fromCurrencyId,
            toCurrencyId,
            baseRate: rate.rate.toString(),
            markupPercent: defaultMarkup,
            isActive: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          createdCount++;
        }
      } catch (error) {
        console.error(`[RatesUpdater] Error updating rate ${rate.from}/${rate.to}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RatesUpdater] Update completed in ${duration}ms: ${updatedCount} updated, ${createdCount} created, ${skippedCount} skipped`);
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
