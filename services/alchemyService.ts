// OnSpace Wallet — Alchemy transaction history service
import { NetworkId } from '../constants/config';

const ALCHEMY_KEY = process.env.EXPO_PUBLIC_ALCHEMY_KEY ?? '';
const ETHERSCAN_KEY = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY ?? '';
const POLYGONSCAN_KEY = process.env.EXPO_PUBLIC_POLYGONSCAN_API_KEY ?? '';

// Etherscan V2 unified API base (supports all chains via chainid parameter)
const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';

// Chain IDs for Etherscan V2
const CHAIN_IDS: Record<string, { mainnet: number; testnet: number }> = {
  ethereum: { mainnet: 1, testnet: 11155111 },
  polygon:  { mainnet: 137, testnet: 80002 },
};

export interface AlchemyTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  type: 'send' | 'receive';
  network: NetworkId;
  gasUsed?: string;
  tokenName?: string;
  tokenSymbol?: string;
  isToken?: boolean;
  blockNumber?: string;
  asset?: string;
}

function getAlchemyUrl(networkId: NetworkId, isTestnet: boolean): string {
  if (!ALCHEMY_KEY) {
    if (networkId === 'ethereum') return isTestnet ? 'https://rpc.sepolia.org' : 'https://cloudflare-eth.com';
    if (networkId === 'bsc') return isTestnet ? 'https://data-seed-prebsc-1-s1.binance.org:8545' : 'https://bsc-dataseed.binance.org/';
    if (networkId === 'polygon') return isTestnet ? 'https://rpc-amoy.polygon.technology' : 'https://polygon-rpc.com';
    if (networkId === 'solana') return isTestnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com';
    return '';
  }
  const k = ALCHEMY_KEY;
  if (networkId === 'ethereum') return isTestnet ? `https://eth-sepolia.g.alchemy.com/v2/${k}` : `https://eth-mainnet.g.alchemy.com/v2/${k}`;
  if (networkId === 'bsc') return isTestnet ? `https://bnb-testnet.g.alchemy.com/v2/${k}` : `https://bnb-mainnet.g.alchemy.com/v2/${k}`;
  if (networkId === 'polygon') return isTestnet ? `https://polygon-amoy.g.alchemy.com/v2/${k}` : `https://polygon-mainnet.g.alchemy.com/v2/${k}`;
  if (networkId === 'solana') return isTestnet ? `https://solana-devnet.g.alchemy.com/v2/${k}` : `https://solana-mainnet.g.alchemy.com/v2/${k}`;
  return '';
}

// ─── Alchemy alchemy_getAssetTransfers (EVM) ──────────────────────────────────

async function fetchEVMAlchemyTransactions(
  address: string,
  networkId: Exclude<NetworkId, 'solana'>,
  isTestnet: boolean,
  limit = 25
): Promise<AlchemyTransaction[]> {
  if (!ALCHEMY_KEY) return [];
  const rpcUrl = getAlchemyUrl(networkId, isTestnet);
  if (!rpcUrl) return [];

  const categoriesByNetwork: Record<string, string[]> = {
    ethereum: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
    polygon:  ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
    bsc:      ['external', 'erc20', 'erc721', 'erc1155'],
  };
  const categories = categoriesByNetwork[networkId] ?? ['external', 'erc20', 'erc721', 'erc1155'];

  let rawTxs: any[] = [];

  try {
    const [outgoing, incoming] = await Promise.allSettled([
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1, jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x0',
            fromAddress: address,
            category: categories,
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: `0x${limit.toString(16)}`,
            order: 'desc',
          }],
        }),
      }).then(async (r) => {
        const json = await r.json();
        if (json.error) { console.log('[AlchemyService] outgoing error', json.error); return { result: { transfers: [] } }; }
        return json;
      }).catch((err) => { console.log('[AlchemyService] outgoing request failed', err); return { result: { transfers: [] } }; }),

      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 2, jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x0',
            toAddress: address,
            category: categories,
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: `0x${limit.toString(16)}`,
            order: 'desc',
          }],
        }),
      }).then(async (r) => {
        const json = await r.json();
        if (json.error) { console.log('[AlchemyService] incoming error', json.error); return { result: { transfers: [] } }; }
        return json;
      }).catch((err) => { console.log('[AlchemyService] incoming request failed', err); return { result: { transfers: [] } }; }),
    ]);

    if (outgoing.status === 'fulfilled') {
      for (const t of outgoing.value?.result?.transfers ?? []) rawTxs.push({ ...t, _dir: 'send' });
    }
    if (incoming.status === 'fulfilled') {
      for (const t of incoming.value?.result?.transfers ?? []) rawTxs.push({ ...t, _dir: 'receive' });
    }
  } catch (err) {
    console.log('[AlchemyService] fetchEVMAlchemyTransactions error:', err);
  }

  const seen = new Set<string>();
  const txs: AlchemyTransaction[] = [];

  for (const t of rawTxs) {
    const dedupeKey = `${t.hash}_${t._dir}_${t.from}_${t.to}_${t.asset}_${t.value}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const isToken = t.category === 'erc20' || t.category === 'erc721' || t.category === 'erc1155';
    let value = '0.000000';
    if (isToken && t.rawContract?.value && t.rawContract?.decimal) {
      const raw = BigInt(t.rawContract.value.toString?.() ?? t.rawContract.value);
      const decimals = Number(t.rawContract.decimal);
      value = !Number.isNaN(decimals) && decimals >= 0
        ? (Number(raw) / 10 ** decimals).toFixed(6)
        : String(t.value ?? '0');
    } else if (t.value != null) {
      const rawValue = Number(t.value);
      value = !Number.isNaN(rawValue) ? rawValue.toFixed(6) : String(t.value);
    }

    txs.push({
      hash: t.hash ?? '',
      from: t.from ?? '',
      to: t.to ?? '',
      value,
      symbol: t.asset ?? (isToken ? 'TOKEN' : networkId === 'bsc' ? 'BNB' : networkId === 'polygon' ? 'POL' : 'ETH'),
      timestamp: t.metadata?.blockTimestamp ? new Date(t.metadata.blockTimestamp).getTime() : Date.now(),
      status: 'confirmed',
      type: t._dir === 'send' ? 'send' : 'receive',
      network: networkId,
      tokenName: isToken ? t.asset : undefined,
      tokenSymbol: isToken ? t.asset : undefined,
      isToken,
      blockNumber: t.blockNum ? parseInt(t.blockNum, 16).toString() : undefined,
      asset: t.asset,
    });
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

// ─── Etherscan V2 fallback (ETH + Polygon) ───────────────────────────────────

async function fetchEtherscanV2Transactions(
  address: string,
  networkId: 'ethereum' | 'polygon',
  isTestnet: boolean,
  limit = 25
): Promise<AlchemyTransaction[]> {
  const apiKey = networkId === 'polygon' ? (POLYGONSCAN_KEY || ETHERSCAN_KEY) : ETHERSCAN_KEY;
  if (!apiKey) { console.log('[AlchemyService] No Etherscan/Polygonscan API key'); return []; }

  const chainIds = CHAIN_IDS[networkId];
  if (!chainIds) return [];
  const chainId = isTestnet ? chainIds.testnet : chainIds.mainnet;

  const symbol = networkId === 'polygon' ? 'POL' : 'ETH';
  const txs: AlchemyTransaction[] = [];
  const seen = new Set<string>();

  try {
    // Normal transactions
    const normalParams = new URLSearchParams({
      chainid: String(chainId),
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: String(limit),
      sort: 'desc',
      apikey: apiKey,
    });
    const normalRes = await fetch(`${ETHERSCAN_V2}?${normalParams.toString()}`);
    const normalData = await normalRes.json();

    if (normalData.status === '1' && Array.isArray(normalData.result)) {
      for (const tx of normalData.result.slice(0, limit)) {
        if (!tx.hash) continue;
        seen.add(tx.hash);
        const value = (Number(tx.value || '0') / 1e18).toFixed(6);
        const isSend = String(tx.from || '').toLowerCase() === address.toLowerCase();
        txs.push({
          hash: tx.hash,
          from: tx.from ?? '',
          to: tx.to ?? '',
          value,
          symbol,
          timestamp: Number(tx.timeStamp || 0) * 1000,
          status: tx.txreceipt_status === '1' || tx.isError === '0' ? 'confirmed' : 'failed',
          type: isSend ? 'send' : 'receive',
          network: networkId as NetworkId,
          blockNumber: tx.blockNumber ?? '',
          gasUsed: tx.gasUsed && tx.gasPrice
            ? ((Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18).toFixed(8)
            : undefined,
          asset: symbol,
        });
      }
    } else {
      console.log(`[AlchemyService] Etherscan V2 normal txs status=${normalData.status} msg=${normalData.message}`);
    }

    // ERC-20 token transfers
    const tokenParams = new URLSearchParams({
      chainid: String(chainId),
      module: 'account',
      action: 'tokentx',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: String(limit),
      sort: 'desc',
      apikey: apiKey,
    });
    const tokenRes = await fetch(`${ETHERSCAN_V2}?${tokenParams.toString()}`);
    const tokenData = await tokenRes.json();

    if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
      for (const tx of tokenData.result.slice(0, limit)) {
        if (!tx.hash) continue;
        const dedupeKey = `${tx.hash}_token_${tx.tokenSymbol}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const decimals = Number(tx.tokenDecimal ?? 18);
        const bigVal = BigInt(tx.value ?? '0');
        const divisor = BigInt(10 ** decimals);
        const whole = bigVal / divisor;
        const rem = bigVal % divisor;
        const fracStr = rem.toString().padStart(decimals, '0').slice(0, 6);
        const value = `${whole}.${fracStr}`;
        const isSend = String(tx.from || '').toLowerCase() === address.toLowerCase();

        txs.push({
          hash: tx.hash + '_token_' + tx.tokenSymbol,
          from: tx.from ?? '',
          to: tx.to ?? '',
          value,
          symbol: tx.tokenSymbol ?? 'TOKEN',
          timestamp: Number(tx.timeStamp || 0) * 1000,
          status: 'confirmed',
          type: isSend ? 'send' : 'receive',
          network: networkId as NetworkId,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          isToken: true,
          blockNumber: tx.blockNumber ?? '',
          asset: tx.tokenSymbol,
        });
      }
    }
  } catch (err) {
    console.log(`[AlchemyService] Etherscan V2 error for ${networkId}:`, err);
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

// ─── Solana ───────────────────────────────────────────────────────────────────

async function fetchSolanaAlchemyTransactions(
  address: string,
  isTestnet: boolean,
  limit = 25
): Promise<AlchemyTransaction[]> {
  const rpcUrl = getAlchemyUrl('solana', isTestnet);
  if (!rpcUrl) return [];

  try {
    const sigRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit }] }),
    });
    const sigData = await sigRes.json();
    const signatures: any[] = sigData.result ?? [];
    if (signatures.length === 0) return [];

    const details = await Promise.allSettled(
      signatures.slice(0, 10).map(async (sig: any) => {
        const txRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'getTransaction',
            params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
          }),
        });
        const txData = await txRes.json();
        return { sig, tx: txData.result };
      })
    );

    const txs: AlchemyTransaction[] = [];
    for (const result of details) {
      if (result.status !== 'fulfilled' || !result.value.tx) continue;
      const { sig, tx } = result.value;
      const meta = tx.meta;
      const blockTime = tx.blockTime;
      if (!meta || !blockTime) continue;

      const preBalances: number[] = meta.preBalances ?? [];
      const postBalances: number[] = meta.postBalances ?? [];
      const accountKeys: any[] = tx.transaction?.message?.accountKeys ?? [];

      let myIdx = -1;
      for (let i = 0; i < accountKeys.length; i++) {
        const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey ?? '';
        if (key === address) { myIdx = i; break; }
      }
      if (myIdx === -1) continue;

      const diff = (postBalances[myIdx] ?? 0) - (preBalances[myIdx] ?? 0);
      const valueSol = Math.abs(diff) / 1e9;
      if (valueSol < 0.000001) continue;

      let counterparty = 'Unknown';
      for (let i = 0; i < accountKeys.length; i++) {
        if (i === myIdx) continue;
        const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey ?? '';
        if (key) { counterparty = key; break; }
      }

      txs.push({
        hash: sig.signature,
        from: diff < 0 ? address : counterparty,
        to: diff < 0 ? counterparty : address,
        value: valueSol.toFixed(6),
        symbol: 'SOL',
        timestamp: blockTime * 1000,
        status: meta.err ? 'failed' : 'confirmed',
        type: diff < 0 ? 'send' : 'receive',
        network: 'solana',
      });
    }
    return txs;
  } catch (err) {
    console.log('[AlchemyService] Solana error:', err);
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAlchemyTransactions(
  address: string,
  networkId: NetworkId,
  isTestnet: boolean,
  limit = 25
): Promise<AlchemyTransaction[]> {
  if (!address) return [];
  console.log(`[AlchemyService] fetchAlchemyTransactions ${networkId} ${isTestnet ? 'testnet' : 'mainnet'} addr=${address.slice(0, 10)}...`);

  try {
    if (networkId === 'solana') {
      const txs = await fetchSolanaAlchemyTransactions(address, isTestnet, limit);
      console.log(`[AlchemyService] Solana: ${txs.length} txs`);
      return txs;
    }

    // Try Alchemy first (best source — supports all EVM chains)
    if (ALCHEMY_KEY) {
      const txs = await fetchEVMAlchemyTransactions(address, networkId as Exclude<NetworkId, 'solana'>, isTestnet, limit);
      console.log(`[AlchemyService] Alchemy ${networkId}: ${txs.length} txs`);
      if (txs.length > 0) return txs;
    }

    // Fallback: Etherscan V2 for ETH and Polygon
    if (networkId === 'ethereum') {
      const txs = await fetchEtherscanV2Transactions(address, 'ethereum', isTestnet, limit);
      console.log(`[AlchemyService] Etherscan V2 ETH fallback: ${txs.length} txs`);
      return txs;
    }

    if (networkId === 'polygon') {
      const txs = await fetchEtherscanV2Transactions(address, 'polygon', isTestnet, limit);
      console.log(`[AlchemyService] Etherscan V2 Polygon fallback: ${txs.length} txs`);
      return txs;
    }

    // BSC: only Alchemy supported (BscScan V1 deprecated, Etherscan V2 free tier doesn't cover BSC)
    console.log(`[AlchemyService] BSC: no fallback available without Alchemy key`);
    return [];
  } catch (err) {
    console.log('[AlchemyService] Error:', err);
    // Emergency fallback for ETH and Polygon
    if (networkId === 'ethereum') return fetchEtherscanV2Transactions(address, 'ethereum', isTestnet, limit);
    if (networkId === 'polygon') return fetchEtherscanV2Transactions(address, 'polygon', isTestnet, limit);
    return [];
  }
}

export function isAlchemyConfigured(): boolean {
  return !!ALCHEMY_KEY;
}
