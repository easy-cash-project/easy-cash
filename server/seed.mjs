import { drizzle } from "drizzle-orm/mysql2";
import { currencies } from "../drizzle/schema.ts";

const CURRENCIES_SEED = [
  { code: "BTC", name: "Bitcoin", type: "crypto", network: null, symbol: "₿", category: "Crypto", sortOrder: 1 },
  { code: "ETH", name: "Ethereum", type: "crypto", network: null, symbol: "Ξ", category: "Crypto", sortOrder: 2 },
  { code: "LTC", name: "Litecoin", type: "crypto", network: null, symbol: "Ł", category: "Crypto", sortOrder: 3 },
  { code: "XMR", name: "Monero", type: "crypto", network: null, symbol: "ɱ", category: "Crypto", sortOrder: 4 },
  { code: "TON", name: "Toncoin", type: "crypto", network: null, symbol: "💎", category: "Crypto", sortOrder: 5 },
  { code: "TRX", name: "Tron", type: "crypto", network: null, symbol: "T", category: "Crypto", sortOrder: 6 },
  { code: "USDT", name: "Tether ERC20", type: "crypto", network: "ERC20", symbol: "₮", category: "Crypto", sortOrder: 7 },
  { code: "USDT", name: "Tether TRC20", type: "crypto", network: "TRC20", symbol: "₮", category: "Crypto", sortOrder: 8 },
  { code: "USDT", name: "Tether BEP20", type: "crypto", network: "BEP20", symbol: "₮", category: "Crypto", sortOrder: 9 },
  { code: "USDT", name: "Tether SOL", type: "crypto", network: "SOL", symbol: "₮", category: "Crypto", sortOrder: 10 },
  { code: "USDT", name: "Tether TON", type: "crypto", network: "TON", symbol: "₮", category: "Crypto", sortOrder: 11 },
  { code: "VISA_MC", name: "Visa/Mastercard", type: "fiat", network: null, symbol: "💳", category: "Cards", sortOrder: 12 },
  { code: "TBANK", name: "T-Bank", type: "fiat", network: null, symbol: "🏦", category: "Cards", sortOrder: 13 },
  { code: "SBER", name: "Sber", type: "fiat", network: null, symbol: "🏦", category: "Cards", sortOrder: 14 },
  { code: "SBP", name: "СБП", type: "fiat", network: null, symbol: "⚡", category: "Cards", sortOrder: 15 },
  { code: "MIR", name: "МИР", type: "fiat", network: null, symbol: "💳", category: "Cards", sortOrder: 16 },
  { code: "CASH", name: "Наличные", type: "fiat", network: null, symbol: "💵", category: "Cash", sortOrder: 17 },
  { code: "TBANK_CASHIN", name: "T-Bank cash-in", type: "fiat", network: null, symbol: "🏧", category: "Cash", sortOrder: 18 },
  { code: "TBANK_QR", name: "T-Bank QR ATM", type: "fiat", network: null, symbol: "📱", category: "ATM", sortOrder: 19 },
  { code: "SBER_QR", name: "Sber QR ATM", type: "fiat", network: null, symbol: "📱", category: "ATM", sortOrder: 20 },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  
  const db = drizzle(process.env.DATABASE_URL);
  
  console.log("Seeding currencies...");
  for (const c of CURRENCIES_SEED) {
    try {
      await db.insert(currencies).values({
        code: c.code,
        name: c.name,
        type: c.type,
        network: c.network,
        symbol: c.symbol,
        category: c.category,
        sortOrder: c.sortOrder,
        isActive: 1,
      });
      console.log(`  ✓ ${c.name}`);
    } catch (e) {
      console.log(`  ⚠ ${c.name}: ${e.message}`);
    }
  }
  
  console.log("Done!");
  process.exit(0);
}

seed();
