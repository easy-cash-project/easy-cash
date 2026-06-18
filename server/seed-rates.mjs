import { getDb } from './_core/db.js';

const cryptoCurrencies = ['USDT_TRC20', 'USDT_BEP20', 'USDT_SOL', 'USDT_TON', 'BTC', 'ETH', 'LTC', 'TON', 'XMR'];

// Mock rates for testing (in production, these would come from Rapira + CoinGecko)
const mockRates = {
  'USDT_TRC20': 75,
  'USDT_BEP20': 75,
  'USDT_SOL': 75,
  'USDT_TON': 75,
  'BTC': 9250000,
  'ETH': 350000,
  'LTC': 12500,
  'TON': 550,
  'XMR': 25000,
};

async function seedExchangeRates() {
  try {
    const db = getDb();
    console.log('🌱 Seeding exchange rates...');

    // Get all currencies
    const currenciesResult = await db.query('SELECT id, code FROM currencies');
    const currencyMap = {};
    currenciesResult.rows.forEach(row => {
      currencyMap[row.code] = row.id;
    });

    const rubId = currencyMap['RUB'];
    let ratesCreated = 0;

    // For each crypto currency
    for (const fromCrypto of cryptoCurrencies) {
      const fromId = currencyMap[fromCrypto];
      if (!fromId) continue;

      const priceRub = mockRates[fromCrypto];
      if (!priceRub) continue;

      // Create rate for crypto -> RUB
      const existing = await db.query(
        'SELECT id FROM exchangeRates WHERE fromCurrencyId = $1 AND toCurrencyId = $2',
        [fromId, rubId]
      );

      if (existing.rows.length === 0) {
        await db.query(
          'INSERT INTO exchangeRates (fromCurrencyId, toCurrencyId, baseRate, markupPercent, isActive) VALUES ($1, $2, $3, $4, $5)',
          [fromId, rubId, priceRub, 0, 1]
        );
        console.log(`✅ Added rate: ${fromCrypto} -> RUB (${priceRub.toFixed(2)} ₽)`);
        ratesCreated++;
      }

      // Create rate for RUB -> crypto
      const rubToExisting = await db.query(
        'SELECT id FROM exchangeRates WHERE fromCurrencyId = $1 AND toCurrencyId = $2',
        [rubId, fromId]
      );

      if (rubToExisting.rows.length === 0) {
        const rubToCryptoRate = 1 / priceRub;
        await db.query(
          'INSERT INTO exchangeRates (fromCurrencyId, toCurrencyId, baseRate, markupPercent, isActive) VALUES ($1, $2, $3, $4, $5)',
          [rubId, fromId, rubToCryptoRate, 0, 1]
        );
        console.log(`✅ Added rate: RUB -> ${fromCrypto}`);
        ratesCreated++;
      }

      // Create rates between crypto currencies
      for (const toCrypto of cryptoCurrencies) {
        if (fromCrypto === toCrypto) continue;

        const toId = currencyMap[toCrypto];
        if (!toId) continue;

        const toPriceRub = mockRates[toCrypto];
        if (!toPriceRub) continue;

        const existing = await db.query(
          'SELECT id FROM exchangeRates WHERE fromCurrencyId = $1 AND toCurrencyId = $2',
          [fromId, toId]
        );

        if (existing.rows.length === 0) {
          const cryptoToCryptoRate = priceRub / toPriceRub;
          await db.query(
            'INSERT INTO exchangeRates (fromCurrencyId, toCurrencyId, baseRate, markupPercent, isActive) VALUES ($1, $2, $3, $4, $5)',
            [fromId, toId, cryptoToCryptoRate, 0, 1]
          );
          console.log(`✅ Added rate: ${fromCrypto} -> ${toCrypto}`);
          ratesCreated++;
        }
      }
    }

    console.log(`✅ Exchange rates seeded successfully! (${ratesCreated} rates created)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exchange rates:', error);
    process.exit(1);
  }
}

seedExchangeRates();
