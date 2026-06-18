import { getDb } from './_core/db.js';

const addresses = [
  {
    currencyCode: 'USDT_TRC20',
    address: 'TWc1QzHxa5JcdbBCNmem3Ab7T6GyRUwexK',
    label: 'USDT TRC20 Wallet',
  },
  {
    currencyCode: 'USDT_BEP20',
    address: '0x8D73D376410Eec9b5DAaA9612E69754432372191',
    label: 'USDT BEP20 Wallet',
  },
  {
    currencyCode: 'USDT_SOL',
    address: '7Sujm4R4nC8W2z2eGx3T83jyFbfzPqBPu7BqjGYao5BY',
    label: 'USDT SOL Wallet',
  },
  {
    currencyCode: 'USDT_TON',
    address: 'UQBraQDC2JTumcZMzSX0ZTtTSwOZt9INkhMJprIj4Z_ooh9i',
    label: 'USDT TON Wallet',
  },
  {
    currencyCode: 'BTC',
    address: 'bc1qlge7n68ugkqap5u699a64j3veqn2kjwyp6thgj',
    label: 'Bitcoin Wallet',
  },
  {
    currencyCode: 'ETH',
    address: '0x8D73D376410Eec9b5DAaA9612E69754432372191',
    label: 'Ethereum Wallet',
  },
  {
    currencyCode: 'LTC',
    address: 'ltc1qsrtwj6v3xn5nkrkrn2cm2auskxavzc06pelvxc',
    label: 'Litecoin Wallet',
  },
  {
    currencyCode: 'TON',
    address: 'UQBraQDC2JTumcZMzSX0ZTtTSwOZt9INkhMJprIj4Z_ooh9i',
    label: 'Toncoin Wallet',
  },
  {
    currencyCode: 'XMR',
    address: '7Sujm4R4nC8W2z2eGx3T83jyFbfzPqBPu7BqjGYao5BY',
    label: 'Monero Wallet',
  },
];

async function seedAddresses() {
  try {
    const db = getDb();
    console.log('🌱 Seeding deposit addresses...');

    // Get all currencies
    const currenciesResult = await db.query('SELECT id, code FROM currencies');
    const currencyMap = {};
    currenciesResult.rows.forEach(row => {
      currencyMap[row.code] = row.id;
    });

    let addressesCreated = 0;

    for (const addr of addresses) {
      const currencyId = currencyMap[addr.currencyCode];
      if (!currencyId) {
        console.warn(`⚠️  Currency not found: ${addr.currencyCode}`);
        continue;
      }

      // Check if address already exists
      const existing = await db.query(
        'SELECT id FROM depositAddresses WHERE currencyId = $1 AND address = $2',
        [currencyId, addr.address]
      );

      if (existing.rows.length === 0) {
        await db.query(
          'INSERT INTO depositAddresses (currencyId, address, label, isActive) VALUES ($1, $2, $3, $4)',
          [currencyId, addr.address, addr.label, 1]
        );
        console.log(`✅ Added address for ${addr.currencyCode}: ${addr.address.substring(0, 20)}...`);
        addressesCreated++;
      } else {
        console.log(`⏭️  Address already exists for ${addr.currencyCode}`);
      }
    }

    console.log(`✅ Deposit addresses seeded successfully! (${addressesCreated} addresses created)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding addresses:', error);
    process.exit(1);
  }
}

seedAddresses();
