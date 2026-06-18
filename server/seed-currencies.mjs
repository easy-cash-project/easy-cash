import { getDb } from './_core/db.js';

const currencies = [
  {
    code: 'USDT_TRC20',
    name: 'USDT (Tron)',
    type: 'crypto',
    network: 'TRC20',
    symbol: '₮',
    isActive: 1,
  },
  {
    code: 'USDT_BEP20',
    name: 'USDT (BSC)',
    type: 'crypto',
    network: 'BEP20',
    symbol: '₮',
    isActive: 1,
  },
  {
    code: 'USDT_SOL',
    name: 'USDT (Solana)',
    type: 'crypto',
    network: 'SOL',
    symbol: '₮',
    isActive: 1,
  },
  {
    code: 'USDT_TON',
    name: 'USDT (Ton)',
    type: 'crypto',
    network: 'TON',
    symbol: '₮',
    isActive: 1,
  },
  {
    code: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    network: 'BTC',
    symbol: '₿',
    isActive: 1,
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    network: 'ETH',
    symbol: 'Ξ',
    isActive: 1,
  },
  {
    code: 'LTC',
    name: 'Litecoin',
    type: 'crypto',
    network: 'LTC',
    symbol: 'Ł',
    isActive: 1,
  },
  {
    code: 'TON',
    name: 'Toncoin',
    type: 'crypto',
    network: 'TON',
    symbol: '💎',
    isActive: 1,
  },
  {
    code: 'XMR',
    name: 'Monero',
    type: 'crypto',
    network: 'XMR',
    symbol: 'ɱ',
    isActive: 1,
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    type: 'fiat',
    network: 'RUB',
    symbol: '₽',
    isActive: 1,
  },
];

async function seedCurrencies() {
  try {
    const db = getDb();
    console.log('🌱 Seeding currencies...');

    for (const currency of currencies) {
      const existing = await db.query(
        'SELECT id FROM currencies WHERE code = $1',
        [currency.code]
      );

      if (existing.rows.length === 0) {
        await db.query(
          'INSERT INTO currencies (code, name, type, network, symbol, isActive) VALUES ($1, $2, $3, $4, $5, $6)',
          [currency.code, currency.name, currency.type, currency.network, currency.symbol, currency.isActive]
        );
        console.log(`✅ Added currency: ${currency.code}`);
      } else {
        console.log(`⏭️  Currency already exists: ${currency.code}`);
      }
    }

    console.log('✅ Currencies seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    process.exit(1);
  }
}

seedCurrencies();
