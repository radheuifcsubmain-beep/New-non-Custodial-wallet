import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Linking, Platform, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii } from '../../constants/theme';

const HISTORY_STORAGE_KEY = 'xu_browser_history';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';
const MAX_HISTORY = 50;

const DAPPS = [
  {
    label: 'Uniswap',
    url: 'https://app.uniswap.org',
    favicon: 'https://www.google.com/s2/favicons?domain=uniswap.org&sz=64',
    category: 'DEX',
    desc: 'Decentralized trading protocol',
    tvl: '$4.2B',
    color: '#FF007A',
  },
  {
    label: 'Aave',
    url: 'https://app.aave.com',
    favicon: 'https://www.google.com/s2/favicons?domain=aave.com&sz=64',
    category: 'Lending',
    desc: 'Decentralized lending & borrowing',
    tvl: '$9.8B',
    color: '#B6509E',
  },
  {
    label: 'Curve Finance',
    url: 'https://curve.fi',
    favicon: 'https://www.google.com/s2/favicons?domain=curve.fi&sz=64',
    category: 'DEX',
    desc: 'Stablecoin liquidity protocol',
    tvl: '$1.9B',
    color: '#A0D8EF',
  },
  {
    label: 'Lido',
    url: 'https://lido.fi',
    favicon: 'https://www.google.com/s2/favicons?domain=lido.fi&sz=64',
    category: 'Staking',
    desc: 'Liquid staking for Ethereum',
    tvl: '$24B',
    color: '#00A3FF',
  },
  {
    label: 'MakerDAO',
    url: 'https://app.sparkprotocol.io',
    favicon: 'https://www.google.com/s2/favicons?domain=makerdao.com&sz=64',
    category: 'Lending',
    desc: 'DAI stablecoin & lending',
    tvl: '$6.1B',
    color: '#1AAB9B',
  },
  {
    label: 'Compound',
    url: 'https://app.compound.finance',
    favicon: 'https://www.google.com/s2/favicons?domain=compound.finance&sz=64',
    category: 'Lending',
    desc: 'Algorithmic money markets',
    tvl: '$2.3B',
    color: '#00D395',
  },
  {
    label: 'OpenSea',
    url: 'https://opensea.io',
    favicon: 'https://www.google.com/s2/favicons?domain=opensea.io&sz=64',
    category: 'NFT',
    desc: 'Leading NFT marketplace',
    tvl: null,
    color: '#2081E2',
  },
  {
    label: 'Blur',
    url: 'https://blur.io',
    favicon: 'https://www.google.com/s2/favicons?domain=blur.io&sz=64',
    category: 'NFT',
    desc: 'Professional NFT marketplace',
    tvl: null,
    color: '#FF8700',
  },
  {
    label: 'PancakeSwap',
    url: 'https://pancakeswap.finance',
    favicon: 'https://www.google.com/s2/favicons?domain=pancakeswap.finance&sz=64',
    category: 'DEX',
    desc: 'BNB Chain leading DEX',
    tvl: '$1.6B',
    color: '#1FC7D4',
  },
  {
    label: '1inch',
    url: 'https://app.1inch.io',
    favicon: 'https://www.google.com/s2/favicons?domain=1inch.io&sz=64',
    category: 'DEX',
    desc: 'DEX aggregator & router',
    tvl: null,
    color: '#1B314F',
  },
  {
    label: 'Etherscan',
    url: 'https://etherscan.io',
    favicon: 'https://www.google.com/s2/favicons?domain=etherscan.io&sz=64',
    category: 'Explorer',
    desc: 'Ethereum block explorer',
    tvl: null,
    color: '#21325B',
  },
  {
    label: 'BscScan',
    url: 'https://bscscan.com',
    favicon: 'https://www.google.com/s2/favicons?domain=bscscan.com&sz=64',
    category: 'Explorer',
    desc: 'BNB Chain block explorer',
    tvl: null,
    color: '#F3BA2F',
  },
  {
    label: 'PolygonScan',
    url: 'https://polygonscan.com',
    favicon: 'https://www.google.com/s2/favicons?domain=polygonscan.com&sz=64',
    category: 'Explorer',
    desc: 'Polygon block explorer',
    tvl: null,
    color: '#8247E5',
  },
  {
    label: 'Solscan',
    url: 'https://solscan.io',
    favicon: 'https://www.google.com/s2/favicons?domain=solscan.io&sz=64',
    category: 'Explorer',
    desc: 'Solana block explorer',
    tvl: null,
    color: '#9945FF',
  },
  {
    label: 'DeFiLlama',
    url: 'https://defillama.com',
    favicon: 'https://www.google.com/s2/favicons?domain=defillama.com&sz=64',
    category: 'Analytics',
    desc: 'DeFi analytics & TVL tracker',
    tvl: null,
    color: '#3B4B6B',
  },
  {
    label: 'CoinGecko',
    url: 'https://www.coingecko.com',
    favicon: 'https://www.google.com/s2/favicons?domain=coingecko.com&sz=64',
    category: 'Analytics',
    desc: 'Crypto market data platform',
    tvl: null,
    color: '#8DC647',
  },
  {
    label: 'GMX',
    url: 'https://app.gmx.io',
    favicon: 'https://www.google.com/s2/favicons?domain=gmx.io&sz=64',
    category: 'Derivatives',
    desc: 'Decentralized perpetuals',
    tvl: '$636M',
    color: '#3498F5',
  },
  {
    label: 'dYdX',
    url: 'https://dydx.exchange',
    favicon: 'https://www.google.com/s2/favicons?domain=dydx.exchange&sz=64',
    category: 'Derivatives',
    desc: 'Decentralized derivatives exchange',
    tvl: '$440M',
    color: '#6966FF',
  },
  {
    label: 'Raydium',
    url: 'https://raydium.io',
    favicon: 'https://www.google.com/s2/favicons?domain=raydium.io&sz=64',
    category: 'DEX',
    desc: 'Solana AMM & liquidity',
    tvl: '$1.2B',
    color: '#6EE7F7',
  },
  {
    label: 'Jupiter',
    url: 'https://jup.ag',
    favicon: 'https://www.google.com/s2/favicons?domain=jup.ag&sz=64',
    category: 'DEX',
    desc: 'Solana DEX aggregator',
    tvl: null,
    color: '#C7F284',
  },
];

const CATEGORIES = ['All', 'DEX', 'Lending', 'Staking', 'NFT', 'Derivatives', 'Explorer', 'Analytics'];

const CATEGORY_COLORS: Record<string, string> = {
  DEX: '#F59E0B',
  Lending: '#3B82F6',
  Staking: '#10B981',
  NFT: '#EC4899',
  Derivatives: '#8B5CF6',
  Explorer: '#6B7280',
  Analytics: '#0EA5E9',
  All: Colors.primary,
};

interface HistoryEntry {
  url: string;
  title: string;
  favicon: string;
  visitedAt: number;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`;
}

function getDisplayTitle(url: string): string {
  try {
    const u = new URL(url);
    const dapp = DAPPS.find(d => d.url.includes(u.hostname) || u.hostname.includes(d.label.toLowerCase()));
    if (dapp) return dapp.label;
    return u.hostname.replace('www.', '');
  } catch {
    if (url.includes('google.com/search')) {
      const q = url.split('q=')[1];
      return q ? decodeURIComponent(q.split('&')[0]) : 'Google Search';
    }
    return url;
  }
}

function getDisplayHost(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  const dapp = DAPPS.find(d => url.includes(getDisplayHost(d.url)) || getDisplayHost(d.url).includes(getDisplayHost(url)));
  if (dapp) return dapp.favicon;
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return '';
  }
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveToHistory(url: string): Promise<HistoryEntry[]> {
  const existing = await loadHistory();
  const title = getDisplayTitle(url);
  const favicon = getFaviconUrl(url);
  const filtered = existing.filter(h => h.url !== url);
  const updated = [{ url, title, favicon, visitedAt: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function Toast({ message }: { message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[toastStyles.container, { opacity }]}>
      <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
      <Text style={toastStyles.message}>{message}</Text>
    </Animated.View>
  );
}
const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: Colors.surface, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.primary + '55',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
    zIndex: 999,
  },
  message: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
});

function NativeBrowser({ url, onClose }: { url: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const WebView = require('react-native-webview').WebView;
  return (
    <View style={{ flex: 1 }}>
      <View style={nativeStyles.bar}>
        <Pressable onPress={onClose} style={nativeStyles.btn}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={nativeStyles.urlRow}>
          <MaterialIcons name="lock" size={12} color={Colors.success} />
          <Text style={nativeStyles.url} numberOfLines={1}>{getDisplayHost(url)}</Text>
        </View>
        <Pressable onPress={() => Linking.openURL(url)} style={nativeStyles.btn}>
          <MaterialIcons name="open-in-browser" size={20} color={Colors.primary} />
        </Pressable>
      </View>
      {loading && <View style={nativeStyles.loadingBar}><View style={nativeStyles.loadingFill} /></View>}
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
      />
    </View>
  );
}
const nativeStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, backgroundColor: Colors.surfaceElevated },
  urlRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  url: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  loadingBar: { height: 2, backgroundColor: Colors.surfaceBorder },
  loadingFill: { height: '100%', width: '60%', backgroundColor: Colors.primary },
});

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [toast, setToast] = useState<string | null>(null);
  const [nativeUrl, setNativeUrl] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => { loadHistory().then(setHistory); }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const openUrl = useCallback(async (rawUrl: string) => {
    const url = normalizeUrl(rawUrl);
    if (!url) return;
    const updated = await saveToHistory(url);
    setHistory(updated);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      showToast(`Opening ${getDisplayTitle(url)}...`);
    } else {
      setNativeUrl(url);
    }
    setSearchText('');
  }, [showToast]);

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    openUrl(searchText.trim());
  }, [searchText, openUrl]);

  const filteredDapps = activeCategory === 'All'
    ? DAPPS
    : DAPPS.filter(d => d.category === activeCategory);

  const displayedHistory = showAllHistory ? history : history.slice(0, 6);

  if (Platform.OS !== 'web' && nativeUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <NativeBrowser url={nativeUrl} onClose={() => setNativeUrl(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Enterprise Header ─────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Web3 Browser</Text>
              <Text style={styles.headerSub}>Discover DeFi · NFT · Infrastructure</Text>
            </View>
            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>LIVE</Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              ref={searchRef}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholder="Search or enter a DApp URL..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              keyboardType="url"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
            <Pressable onPress={handleSearch} style={styles.searchGoBtn} hitSlop={8}>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.textInverse} />
            </Pressable>
          </View>

          {Platform.OS === 'web' && (
            <View style={styles.openInChromeNote}>
              <MaterialIcons name="open-in-new" size={12} color={Colors.accent} />
              <Text style={styles.openInChromeText}>
                DApps open in a new tab — enables full wallet connections
              </Text>
            </View>
          )}
        </View>

        {/* ── Category Filter ─────────────────────────────────────────── */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PROTOCOLS</Text>
            <Text style={styles.sectionCount}>{filteredDapps.length} available</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {CATEGORIES.map(cat => {
              const catColor = CATEGORY_COLORS[cat] ?? Colors.primary;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.catChip,
                    activeCategory === cat && { backgroundColor: catColor + '22', borderColor: catColor },
                  ]}
                >
                  <Text style={[
                    styles.catChipText,
                    activeCategory === cat && { color: catColor, fontWeight: '700' },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* DApp grid */}
          <View style={styles.dappGrid}>
            {filteredDapps.map(dapp => {
              const catColor = CATEGORY_COLORS[dapp.category] ?? Colors.primary;
              return (
                <Pressable
                  key={dapp.url}
                  onPress={() => openUrl(dapp.url)}
                  style={({ pressed }) => [styles.dappCard, pressed && styles.dappCardPressed]}
                >
                  {/* Accent line */}
                  <View style={[styles.dappAccentLine, { backgroundColor: dapp.color }]} />

                  <View style={styles.dappCardInner}>
                    <View style={[styles.dappIconWrap, { backgroundColor: dapp.color + '18', borderColor: dapp.color + '50' }]}>
                      <Image
                        source={{ uri: dapp.favicon }}
                        style={styles.dappIcon}
                        contentFit="contain"
                        transition={150}
                      />
                    </View>

                    <View style={styles.dappInfo}>
                      <Text style={styles.dappLabel} numberOfLines={1}>{dapp.label}</Text>
                      <Text style={styles.dappDesc} numberOfLines={1}>{dapp.desc}</Text>
                      <View style={styles.dappMeta}>
                        <View style={[styles.dappCatBadge, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
                          <Text style={[styles.dappCatText, { color: catColor }]}>{dapp.category}</Text>
                        </View>
                        {dapp.tvl && (
                          <View style={styles.dappTvl}>
                            <Text style={styles.dappTvlText}>{dapp.tvl} TVL</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <MaterialIcons name="open-in-new" size={14} color={Colors.textMuted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── URL History ────────────────────────────────────────────────── */}
        {history.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="history" size={14} color={Colors.textMuted} />
                <Text style={styles.sectionLabel}>RECENT HISTORY</Text>
              </View>
              <Pressable
                onPress={async () => {
                  await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
                  setHistory([]);
                }}
                hitSlop={8}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            </View>

            <View style={styles.historyList}>
              {displayedHistory.map((entry, idx) => (
                <Pressable
                  key={entry.url + entry.visitedAt}
                  onPress={() => openUrl(entry.url)}
                  style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]}
                >
                  <View style={styles.historyIconBg}>
                    {entry.favicon ? (
                      <Image source={{ uri: entry.favicon }} style={{ width: 20, height: 20 }} contentFit="contain" />
                    ) : (
                      <MaterialIcons name="language" size={18} color={Colors.textMuted} />
                    )}
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{entry.title}</Text>
                    <Text style={styles.historyUrl} numberOfLines={1}>{getDisplayHost(entry.url)}</Text>
                  </View>
                  <Text style={styles.historyTime}>{timeAgo(entry.visitedAt)}</Text>
                  <Pressable
                    onPress={async (e) => {
                      e.stopPropagation?.();
                      const fresh = history.filter((_, i) => i !== idx);
                      setHistory(fresh);
                      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(fresh));
                    }}
                    hitSlop={8}
                    style={styles.historyDelete}
                  >
                    <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                  </Pressable>
                </Pressable>
              ))}
            </View>

            {history.length > 6 && (
              <Pressable
                onPress={() => setShowAllHistory(!showAllHistory)}
                style={styles.showMoreBtn}
              >
                <MaterialIcons
                  name={showAllHistory ? 'expand-less' : 'expand-more'}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.showMoreText}>
                  {showAllHistory ? 'Show less' : `Show ${history.length - 6} more`}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialIcons name="security" size={12} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            XU Wallet · Non-custodial · Your keys never leave this device
          </Text>
        </View>
      </ScrollView>

      {toast && <Toast message={toast} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { gap: Spacing.lg, paddingBottom: 20 },

  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.success + '20',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success + '50',
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12, height: 48,
    gap: 8,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  searchGoBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  openInChromeNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  openInChromeText: { fontSize: 11, color: Colors.textMuted },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.2 },
  sectionCount: { fontSize: 11, color: Colors.textMuted },
  clearText: { fontSize: 12, color: Colors.error, fontWeight: '500' },

  catScroll: { paddingHorizontal: Spacing.md, gap: 8, paddingBottom: 12 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radii.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  catChipText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  dappGrid: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dappCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  dappCardPressed: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary + '55',
  },
  dappAccentLine: {
    height: 2,
    width: '100%',
  },
  dappCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dappIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dappIcon: {
    width: 32,
    height: 32,
  },
  dappInfo: {
    flex: 1,
    gap: 3,
  },
  dappLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dappDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dappMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dappCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  dappCatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dappTvl: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.success + '15',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  dappTvlText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },

  historyList: { paddingHorizontal: Spacing.md, gap: 2 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: Radii.md,
  },
  historyItemPressed: { backgroundColor: Colors.surfaceElevated },
  historyIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  historyUrl: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  historyTime: { fontSize: 11, color: Colors.textMuted, minWidth: 50, textAlign: 'right' },
  historyDelete: { padding: 4 },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, marginHorizontal: Spacing.md,
    borderRadius: Radii.md, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.surfaceBorder, marginTop: 4,
  },
  showMoreText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: Spacing.xl,
  },
  footerText: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', flex: 1 },
});
