/**
 * Crypto Rates Matrix Parser
 * Fetches exchange rates for all crypto pairs and RUB
 * Creates a complete matrix of all possible exchanges
 */

// Use built-in fetch (Node.js 18+)

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  ask_price: number; // Sell price (slightly higher)
  bid_price: number; // Buy price (slightly lower)
  timestamp: number;
}

export interface RatesMatrixResponse {
  rates: ExchangeRate[];
  timestamp: number;
  source: string;
  total_pairs: number;
}

// List of all supported cryptocurrencies
const SUPPORTED_CRYPTOS = [
  'USDT_TRC20',
  'USDT_BEP20',
  'USDT_SOL',
  'USDT_TON',
  'USDT_ERC20',
  'BTC',
  'ETH',
  'LTC',
  'TON',
  'TRX',
  'XMR',
];

const FIAT = 'RUB';

/**
 * Fetch rates from Rapira API
 */
async function fetchRapiraRates(): Promise<Map<string, any>> {
  try {
    const response = await fetch('https://api.rapira.net/open/market/rates', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Rapira API error: ${response.status}`);
    }

    const data: any = await response.json();
    const ratesMap = new Map();

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((rate: any) => {
        ratesMap.set(rate.symbol, rate);
      });
    }

    return ratesMap;
  } catch (error) {
    console.error('Error fetching Rapira rates:', error);
    return new Map();
  }
}

/**
 * Fetch crypto prices from CoinGecko API
 */
async function fetchCoinGeckoPrices(): Promise<Map<string, { usd: number; change_24h: number }>> {
  try {
    const cryptoIds = [
      'bitcoin',
      'ethereum',
      'litecoin',
      'tether',
      'monero',
    ];

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: any = await response.json();
    const pricesMap = new Map();

    // Map CoinGecko IDs to symbols
    const idToSymbol: Record<string, string> = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      litecoin: 'LTC',
      tether: 'USDT',
      monero: 'XMR',
    };

    Object.entries(data).forEach(([id, prices]: [string, any]) => {
      const symbol = idToSymbol[id];
      if (symbol && prices.usd) {
        pricesMap.set(symbol, {
          usd: prices.usd,
          change_24h: prices.usd_24h_change || 0,
        });
      }
    });

    return pricesMap;
  } catch (error) {
    console.error('Error fetching CoinGecko prices:', error);
    return new Map();
  }
}

/**
 * Fetch TON price from OKX API
 */
async function fetchOKXTonPrice(retries = 3): Promise<number | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        'https://www.okx.com/api/v5/market/ticker?instId=TON-USDT',
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`OKX API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (data.code === '0' && data.data && data.data.length > 0) {
        const lastPrice = parseFloat(data.data[0].last);
        if (lastPrice > 0) {
          console.log('[RatesParser] TON price from OKX:', lastPrice, 'USDT');
          return lastPrice;
        }
      }

      return null;
    } catch (error) {
      console.warn(`[RatesParser] OKX API attempt ${attempt}/${retries} failed:`, error);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  
  console.error('[RatesParser] Failed to fetch TON price from OKX after retries');
  return null;
}

/**
 * Build complete rates matrix
 */
export async function buildRatesMatrix(): Promise<RatesMatrixResponse> {
  const rapiraRates = await fetchRapiraRates();
  const coinGeckoPrices = await fetchCoinGeckoPrices();
  const okxTonPrice = await fetchOKXTonPrice();

  const rates: ExchangeRate[] = [];

  // Get USDT/RUB rate from Rapira with fallback
  const usdtRubRate = rapiraRates.get('USDT/RUB');
  let usdtToRub = 1; // Default fallback
  
  if (usdtRubRate) {
    usdtToRub = usdtRubRate.close || usdtRubRate.askPrice || 75; // Default to ~75 RUB per USDT
    console.log('[Init] USDT/RUB rate from Rapira:', usdtToRub);
  } else {
    console.warn('[Init] Could not fetch USDT/RUB from Rapira, using fallback rate: 75');
    usdtToRub = 75; // Fallback rate
  }

  // Get base prices in USD
  const basePricesUsd: Map<string, number> = new Map();

  // All USDT variants have the same price
  const usdtPrice = coinGeckoPrices.get('USDT')?.usd || 1;
  SUPPORTED_CRYPTOS.forEach((crypto) => {
    if (crypto.startsWith('USDT')) {
      basePricesUsd.set(crypto, usdtPrice);
    }
  });

  // Other cryptos - use CoinGecko with Rapira/OKX fallback
  const cryptoSymbols = ['BTC', 'ETH', 'LTC', 'TON', 'TRX', 'XMR'];
  cryptoSymbols.forEach((symbol) => {
    let price = coinGeckoPrices.get(symbol)?.usd;
    
    // Special handling for TON: use OKX API
    if (symbol === 'TON' && okxTonPrice) {
      price = okxTonPrice;
    }
    
    // Fallback to Rapira API for TON and TRX if other sources fail
    if (!price && (symbol === 'TON' || symbol === 'TRX')) {
      const rapiraSymbol = symbol === 'TON' ? 'TON/USDT' : 'TRX/USDT';
      const rapiraData = rapiraRates.get(rapiraSymbol);
      if (rapiraData) {
        const cryptoPrice = rapiraData.askPrice || rapiraData.close || 0;
        if (cryptoPrice > 0) {
          price = cryptoPrice; // Already in USDT
        }
      }
    }
    
    if (price) {
      basePricesUsd.set(symbol, price);
    }
  });
  
  console.log('[Init] Base prices USD:', Object.fromEntries(basePricesUsd));

  // Build matrix: each crypto to each other crypto and RUB
  const allCryptos = [...SUPPORTED_CRYPTOS, FIAT];

  for (const fromCrypto of allCryptos) {
    for (const toCrypto of allCryptos) {
      if (fromCrypto === toCrypto) continue; // Skip same currency

      let rate = 0;
      let askPrice = 0;
      let bidPrice = 0;

      if (fromCrypto === FIAT) {
        // RUB to Crypto: 1 RUB = ? Crypto
        const toPrice = basePricesUsd.get(toCrypto);
        if (toPrice) {
          rate = 1 / (toPrice * usdtToRub);
          const markup = 1.002; // 0.2% markup
          askPrice = rate * markup;
          bidPrice = rate / markup;
        }
      } else if (toCrypto === FIAT) {
        // Crypto to RUB: 1 Crypto = ? RUB
        const fromPrice = basePricesUsd.get(fromCrypto);
        if (fromPrice) {
          rate = fromPrice * usdtToRub;
          const markup = 1.002;
          askPrice = rate * markup;
          bidPrice = rate / markup;
        }
      } else {
        // Crypto to Crypto: 1 FromCrypto = ? ToCrypto
        const fromPrice = basePricesUsd.get(fromCrypto);
        const toPrice = basePricesUsd.get(toCrypto);
        if (fromPrice && toPrice) {
          rate = fromPrice / toPrice;
          const markup = 1.002;
          askPrice = rate * markup;
          bidPrice = rate / markup;
        }
      }

      if (rate > 0) {
        rates.push({
          from: fromCrypto,
          to: toCrypto,
          rate: Math.round(rate * 100000000) / 100000000, // 8 decimals
          ask_price: Math.round(askPrice * 100000000) / 100000000,
          bid_price: Math.round(bidPrice * 100000000) / 100000000,
          timestamp: Date.now(),
        });
      }
    }
  }

  return {
    rates,
    timestamp: Date.now(),
    source: 'Rapira + CoinGecko + OKX',
    total_pairs: rates.length,
  };
}

/**
 * Get rate for specific pair
 */
export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
  const matrix = await buildRatesMatrix();
  return matrix.rates.find((r) => r.from === from && r.to === to) || null;
}

/**
 * Get all rates from one currency
 */
export async function getRatesFrom(from: string): Promise<ExchangeRate[]> {
  const matrix = await buildRatesMatrix();
  return matrix.rates.filter((r) => r.from === from);
}

/**
 * Get all rates to one currency
 */
export async function getRatesTo(to: string): Promise<ExchangeRate[]> {
  const matrix = await buildRatesMatrix();
  return matrix.rates.filter((r) => r.to === to);
}

/**
 * No caching - always fetch fresh rates from API
 */
class RatesMatrixCache {
  async get(): Promise<RatesMatrixResponse> {
    // Always fetch fresh data from API
    return await buildRatesMatrix();
  }

  async getRate(from: string, to: string): Promise<ExchangeRate | null> {
    const matrix = await this.get();
    return matrix.rates.find((r) => r.from === from && r.to === to) || null;
  }

  async getRatesFrom(from: string): Promise<ExchangeRate[]> {
    const matrix = await this.get();
    return matrix.rates.filter((r) => r.from === from);
  }

  async getRatesTo(to: string): Promise<ExchangeRate[]> {
    const matrix = await this.get();
    return matrix.rates.filter((r) => r.to === to);
  }

  clear(): void {
    // No cache to clear
  }
}

export const ratesMatrixCache = new RatesMatrixCache();

// Export supported currencies list
export function getSupportedCurrencies(): string[] {
  return [...SUPPORTED_CRYPTOS, FIAT];
}
