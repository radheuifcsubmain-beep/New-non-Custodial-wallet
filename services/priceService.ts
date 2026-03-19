// OnSpace Wallet — Centralized live price service
// Primary: Binance public REST API (no key, real-time)
// Secondary: CoinGecko public API
// Stablecoins always pegged at $1.00

// ─── Symbol mappings ─────────────────────────────────────────────────────────

const COINGECKO_TO_BINANCE: Record<string, string | null> = {
  ethereum:       'ETHUSDT',
  binancecoin:    'BNBUSDT',
  solana:         'SOLUSDT',
  'matic-network': 'MATICUSDT',
  weth:           'ETHUSDT',
  wbnb:           'BNBUSDT',
  tether:         null,
  'usd-coin':     null,
  dai:            null,
};

const STABLE_IDS = new Set(['tether', 'usd-coin', 'dai', 'usdt', 'usdc']);

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  prices: Record<string, number>;
  fetchedAt: number;
}

let _cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

function isCacheValid(): boolean {
  return !!_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS;
}

// ─── Binance batch fetch ──────────────────────────────────────────────────────

async function fetchFromBinance(binanceSymbols: string[]): Promise<Record<string, number>> {
  if (binanceSymbols.length === 0) return {};
  try {
    const encoded = encodeURIComponent(JSON.stringify(binanceSymbols));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbols=${encoded}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return {};
    const data: Array<{ symbol: string; price: string }> = await res.json();
    const result: Record<string, number> = {};
    for (const item of data) {
      const price = parseFloat(item.price);
      if (!isNaN(price) && price > 0) {
        result[item.symbol] = price;
      }
    }
    return result;
  } catch (err) {
    console.log('[PriceService] Binance fetch failed:', err);
    return {};
  }
}

// ─── CoinGecko fallback ───────────────────────────────────────────────────────

async function fetchFromCoinGecko(coinIds: string[]): Promise<Record<string, number>> {
  try {
    const ids = [...new Set(coinIds)].join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data.status?.error_code) {
      console.log('[PriceService] CoinGecko rate limit:', data.status.error_message);
      return {};
    }
    const result: Record<string, number> = {};
    for (const id of coinIds) {
      if (data[id]?.usd) result[id] = data[id].usd;
    }
    return result;
  } catch (err) {
    console.log('[PriceService] CoinGecko fetch failed:', err);
    return {};
  }
}

// ─── Static fallback prices (in case all APIs fail) ──────────────────────────

const FALLBACK_PRICES: Record<string, number> = {
  ethereum:        2000,
  binancecoin:     600,
  'matic-network': 0.35,
  solana:          80,
  weth:            2000,
  wbnb:            600,
  tether:          1,
  'usd-coin':      1,
  dai:             1,
};

// ─── Main price fetch ─────────────────────────────────────────────────────────

export async function fetchPrices(coinIds: string[]): Promise<Record<string, number>> {
  if (isCacheValid() && _cache) {
    const result: Record<string, number> = {};
    for (const id of coinIds) {
      result[id] = _cache.prices[id] ?? FALLBACK_PRICES[id] ?? 0;
    }
    return result;
  }

  const prices: Record<string, number> = {};

  // 1. Stablecoins — always $1
  for (const id of coinIds) {
    if (STABLE_IDS.has(id)) prices[id] = 1;
  }

  // 2. Collect unique Binance symbols for non-stable IDs
  const nonStableIds = coinIds.filter(id => !STABLE_IDS.has(id));
  const binanceSymbolSet = new Set<string>();
  const idToSymbol: Record<string, string> = {};

  for (const id of nonStableIds) {
    const sym = COINGECKO_TO_BINANCE[id];
    if (sym) {
      binanceSymbolSet.add(sym);
      idToSymbol[id] = sym;
    }
  }

  // 3. Fetch from Binance
  const binancePrices = await fetchFromBinance([...binanceSymbolSet]);

  // Map Binance symbol prices back to coinGecko IDs
  for (const [id, sym] of Object.entries(idToSymbol)) {
    if (binancePrices[sym] != null && binancePrices[sym] > 0) {
      prices[id] = binancePrices[sym];
    }
  }

  // 4. Fall back to CoinGecko for any IDs still missing
  const missingIds = nonStableIds.filter(id => prices[id] == null);
  if (missingIds.length > 0) {
    console.log('[PriceService] CoinGecko fallback for:', missingIds);
    const geckoData = await fetchFromCoinGecko(missingIds);
    for (const [id, price] of Object.entries(geckoData)) {
      if (price > 0) prices[id] = price;
    }
  }

  // 5. Last resort — static fallbacks
  for (const id of coinIds) {
    if (prices[id] == null || prices[id] === 0) {
      prices[id] = FALLBACK_PRICES[id] ?? 0;
    }
  }

  // 6. Update cache
  _cache = { prices: { ..._cache?.prices, ...prices }, fetchedAt: Date.now() };

  console.log('[PriceService] Prices fetched:', Object.entries(prices).map(([k, v]) => `${k}=$${v}`).join(', '));
  return prices;
}

// Convenience: fetch a single coin price
export async function fetchPrice(coinId: string): Promise<number> {
  const result = await fetchPrices([coinId]);
  return result[coinId] ?? 0;
}

// Expose 24h change using Binance (optional display)
export async function fetchPriceChanges(coinIds: string[]): Promise<Record<string, number>> {
  const nonStable = coinIds.filter(id => !STABLE_IDS.has(id));
  const symbols = nonStable
    .map(id => COINGECKO_TO_BINANCE[id])
    .filter((s): s is string => !!s);

  const uniqueSymbols = [...new Set(symbols)];
  if (uniqueSymbols.length === 0) return {};

  try {
    const encoded = encodeURIComponent(JSON.stringify(uniqueSymbols));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return {};
    const data: Array<{ symbol: string; priceChangePercent: string }> = await res.json();

    const symToChange: Record<string, number> = {};
    for (const item of data) {
      symToChange[item.symbol] = parseFloat(item.priceChangePercent) || 0;
    }

    const result: Record<string, number> = {};
    for (const id of coinIds) {
      if (STABLE_IDS.has(id)) { result[id] = 0; continue; }
      const sym = COINGECKO_TO_BINANCE[id];
      result[id] = sym ? (symToChange[sym] ?? 0) : 0;
    }
    return result;
  } catch {
    return {};
  }
}
