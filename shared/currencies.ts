// All currencies matching casher.is exactly
export const CURRENCIES_SEED = [
  // Crypto currencies
  { code: "BTC", name: "Bitcoin", type: "crypto" as const, network: null, symbol: "₿", category: "Crypto", sortOrder: 1 },
  { code: "ETH", name: "Ethereum", type: "crypto" as const, network: null, symbol: "Ξ", category: "Crypto", sortOrder: 2 },
  { code: "LTC", name: "Litecoin", type: "crypto" as const, network: null, symbol: "Ł", category: "Crypto", sortOrder: 3 },
  { code: "XMR", name: "Monero", type: "crypto" as const, network: null, symbol: "ɱ", category: "Crypto", sortOrder: 4 },
  { code: "TON", name: "Toncoin", type: "crypto" as const, network: null, symbol: "💎", category: "Crypto", sortOrder: 5 },
  { code: "TRX", name: "Tron", type: "crypto" as const, network: null, symbol: "T", category: "Crypto", sortOrder: 6 },
  { code: "USDT", name: "Tether ERC20", type: "crypto" as const, network: "ERC20", symbol: "₮", category: "Crypto", sortOrder: 7 },
  { code: "USDT", name: "Tether TRC20", type: "crypto" as const, network: "TRC20", symbol: "₮", category: "Crypto", sortOrder: 8 },
  { code: "USDT", name: "Tether BEP20", type: "crypto" as const, network: "BEP20", symbol: "₮", category: "Crypto", sortOrder: 9 },
  { code: "USDT", name: "Tether SOL", type: "crypto" as const, network: "SOL", symbol: "₮", category: "Crypto", sortOrder: 10 },
  { code: "USDT", name: "Tether TON", type: "crypto" as const, network: "TON", symbol: "₮", category: "Crypto", sortOrder: 11 },
  // Fiat / Card methods
  { code: "VISA_MC", name: "Visa/Mastercard", type: "fiat" as const, network: null, symbol: "💳", category: "Карты", sortOrder: 12 },
  { code: "TBANK", name: "T-Bank", type: "fiat" as const, network: null, symbol: "🏦", category: "Карты", sortOrder: 13 },
  { code: "SBER", name: "Sber", type: "fiat" as const, network: null, symbol: "🏦", category: "Карты", sortOrder: 14 },
  { code: "SBP", name: "SBP", type: "fiat" as const, network: null, symbol: "⚡", category: "Карты", sortOrder: 15 },
  { code: "MIR", name: "MIR", type: "fiat" as const, network: null, symbol: "💳", category: "Карты", sortOrder: 16 },
  { code: "CASH", name: "Наличные", type: "fiat" as const, network: null, symbol: "💵", category: "Cash", sortOrder: 17 },
  { code: "TBANK_CASHIN", name: "T-Bank cash-in", type: "fiat" as const, network: null, symbol: "🏧", category: "Cash", sortOrder: 18 },
  { code: "TBANK_QR", name: "T-Bank QR", type: "fiat" as const, network: null, symbol: "📱", category: "ATM", sortOrder: 19 },
  { code: "SBER_QR", name: "Sber QR", type: "fiat" as const, network: null, symbol: "📱", category: "ATM", sortOrder: 20 },
];
