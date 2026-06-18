/**
 * Crypto Rates Parser
 * Fetches exchange rates for RUB to various cryptocurrencies
 * Combines data from Rapira API and CoinGecko
 */

import fetch from 'node-fetch';

interface CryptoRate {
  symbol: string;
  name: string;
  rub_price: number;
  usd_price: number;
  change_24h: number;
  ask_price: number;
  bid_price: number;
  timestamp: number;
}

interface RatesResponse {
  rates: CryptoRate[];
  timestamp: number;
  source: string;
}

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
async function fetchCoinGeckoPrices(): Promise<Map<string, number>> {
  try {
    const cryptoIds = [
      'bitcoin',
      'ethereum',
      'litecoin',
      'tether',
      'ton',
      'monero',
      'binancecoin',
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
      ton: 'TON',
      monero: 'XMR',
      binancecoin: 'BNB',
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
 * Parse all rates and return combined data
 */
export async function parseRates(): Promise<RatesResponse> {
  const rapiraRates = await fetchRapiraRates();
  const coinGeckoPrices = await fetchCoinGeckoPrices();

  const rates: CryptoRate[] = [];

  // Get USDT/RUB rate from Rapira
  const usdtRubRate = rapiraRates.get('USDT/RUB');
  if (!usdtRubRate) {
    throw new Error('Could not fetch USDT/RUB rate from Rapira');
  }

  const usdtToRub = usdtRubRate.close || usdtRubRate.askPrice || 1;

  // Define cryptocurrencies to track
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'LTC', name: 'Litecoin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'TON', name: 'Ton' },
    { symbol: 'XMR', name: 'Monero' },
  ];

  cryptos.forEach((crypto) => {
    const price = coinGeckoPrices.get(crypto.symbol);
    
    if (price) {
      const rubPrice = price.usd * usdtToRub;
      
      rates.push({
        symbol: crypto.symbol,
        name: crypto.name,
        rub_price: Math.round(rubPrice * 100) / 100,
        usd_price: Math.round(price.usd * 100) / 100,
        change_24h: price.change_24h || 0,
        ask_price: Math.round(rubPrice * 1.002 * 100) / 100, // +0.2% markup
        bid_price: Math.round(rubPrice * 0.998 * 100) / 100, // -0.2% markup
        timestamp: Date.now(),
      });
    }
  });

  // Add USDT variants for different chains
  const usdtPrice = coinGeckoPrices.get('USDT');
  if (usdtPrice) {
    const rubPrice = usdtPrice.usd * usdtToRub;
    
    const usdtVariants = [
      { symbol: 'USDT_TRC20', name: 'USDT (Tron)' },
      { symbol: 'USDT_BEP20', name: 'USDT (BSC)' },
      { symbol: 'USDT_SOL', name: 'USDT (Solana)' },
      { symbol: 'USDT_TON', name: 'USDT (Ton)' },
    ];

    usdtVariants.forEach((variant) => {
      rates.push({
        symbol: variant.symbol,
        name: variant.name,
        rub_price: Math.round(rubPrice * 100) / 100,
        usd_price: Math.round(usdtPrice.usd * 100) / 100,
        change_24h: usdtPrice.change_24h || 0,
        ask_price: Math.round(rubPrice * 1.002 * 100) / 100,
        bid_price: Math.round(rubPrice * 0.998 * 100) / 100,
        timestamp: Date.now(),
      });
    });
  }

  return {
    rates,
    timestamp: Date.now(),
    source: 'Rapira + CoinGecko',
  };
}

/**
 * Get single rate for a specific crypto
 */
export async function getRate(symbol: string): Promise<CryptoRate | null> {
  const response = await parseRates();
  return response.rates.find((r) => r.symbol === symbol) || null;
}

/**
 * Cache rates in memory with TTL
 */
class RatesCache {
  private cache: Map<string, { data: RatesResponse; timestamp: number }> = new Map();
  private ttl: number = 60000; // 1 minute

  async get(): Promise<RatesResponse> {
    const cached = this.cache.get('rates');
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await parseRates();
    this.cache.set('rates', { data, timestamp: Date.now() });
    return data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const ratesCache = new RatesCache();
