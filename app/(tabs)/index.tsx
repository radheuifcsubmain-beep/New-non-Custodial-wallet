import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { NetworkSelector } from '../../components/feature/NetworkSelector';
import { BalanceCard } from '../../components/feature/BalanceCard';
import { AssetRow } from '../../components/feature/AssetRow';
import { TokenList } from '../../components/feature/TokenList';
import { LockScreen } from '../../components/feature/LockScreen';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { getNetworks, NetworkId } from '../../constants/config';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    isLoadingBalances, refreshBalances, setSelectedNetwork,
    totalUSD, isLocked, biometricEnabled,
    isTestnet, toggleNetworkMode,
  } = useWallet();

  const activeNetworks = getNetworks(isTestnet);

  const handleAssetPress = useCallback((networkId: NetworkId) => {
    setSelectedNetwork(networkId);
  }, [setSelectedNetwork]);

  if (isLocked) {
    return <LockScreen onUnlocked={() => refreshBalances()} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBrand}>
            <Text style={styles.headerBrandXU}>XU</Text>
            <Text style={styles.headerBrandWallet}> WALLET</Text>
          </Text>
          <Text style={styles.headerLabel}>Portfolio Value</Text>
          <Text style={styles.headerValue}>
            ${totalUSD} <Text style={styles.headerCurrency}>USD</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Network mode toggle */}
          <Pressable
            onPress={toggleNetworkMode}
            style={({ pressed }) => [
              styles.networkToggle,
              isTestnet ? styles.networkToggleTestnet : styles.networkToggleMainnet,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons
              name={isTestnet ? 'science' : 'public'}
              size={11}
              color={isTestnet ? Colors.warning : Colors.accent}
            />
            <Text style={[
              styles.networkToggleText,
              { color: isTestnet ? Colors.warning : Colors.accent },
            ]}>
              {isTestnet ? 'Testnet' : 'Mainnet'}
            </Text>
            <MaterialIcons name="swap-horiz" size={11} color={isTestnet ? Colors.warning : Colors.accent} />
          </Pressable>

          <View style={styles.headerActions}>
            {biometricEnabled && (
              <View style={styles.lockBadge}>
                <MaterialIcons name="fingerprint" size={14} color={Colors.accent} />
              </View>
            )}
            <Pressable
              onPress={() => refreshBalances()}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingBalances}
            onRefresh={refreshBalances}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Network selector */}
        <NetworkSelector />

        {/* Balance card */}
        <BalanceCard onRefresh={refreshBalances} />

        {/* Quick Actions */}
        <View style={styles.quickActionsWrap}>
          <View style={styles.quickActions}>
            {[
              { label: 'Send', icon: 'send', route: '/(tabs)/send', bg: Colors.primaryDim, color: Colors.primary },
              { label: 'Receive', icon: 'qr-code', route: '/(tabs)/receive', bg: Colors.accentDim, color: Colors.accent },
              { label: 'Activity', icon: 'history', route: '/(tabs)/history', bg: Colors.secondaryDim, color: Colors.secondary },
              { label: 'Discover', icon: 'explore', route: '/(tabs)/discover', bg: Colors.surfaceElevated, color: Colors.textSecondary },
              { label: 'Settings', icon: 'settings', route: '/(tabs)/settings', bg: Colors.surfaceElevated, color: Colors.textSecondary },
            ].map(({ label, icon, route, bg, color }) => (
              <Pressable
                key={label}
                onPress={() => router.push(route as any)}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              >
                <View style={[styles.actionIcon, { backgroundColor: bg }]}>
                  <MaterialIcons name={icon as any} size={20} color={color} />
                </View>
                <Text style={styles.actionLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Assets list */}
        <GlassCard style={styles.assetsCard} padding={0}>
          <View style={styles.assetsHeader}>
            <View style={styles.assetsTitleRow}>
              <View style={styles.assetsDot} />
              <Text style={styles.assetsTitle}>My Assets</Text>
            </View>
            <View style={styles.assetsHeaderRight}>
              <Text style={styles.assetsCount}>{Object.keys(activeNetworks).length} chains</Text>
              <View style={[
                styles.modeBadge,
                isTestnet ? styles.modeBadgeTestnet : styles.modeBadgeMainnet,
              ]}>
                <MaterialIcons
                  name={isTestnet ? 'science' : 'public'}
                  size={9}
                  color={isTestnet ? Colors.warning : Colors.accent}
                />
                <Text style={[
                  styles.modeBadgeText,
                  { color: isTestnet ? Colors.warning : Colors.accent },
                ]}>
                  {isTestnet ? 'TESTNET' : 'MAINNET'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.assetsList}>
            {(Object.keys(activeNetworks) as NetworkId[]).map((networkId, idx) => (
              <React.Fragment key={networkId}>
                <AssetRow networkId={networkId} onPress={handleAssetPress} />
                {idx < Object.keys(activeNetworks).length - 1 && (
                  <View style={styles.assetDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* ERC-20 / BEP-20 tokens */}
          <View style={styles.tokenDivider} />
          <TokenList />
        </GlassCard>

        {/* Security notice */}
        <View style={styles.securityNote}>
          <MaterialIcons name="security" size={12} color={Colors.textMuted} />
          <Text style={styles.securityNoteText}>
            XU Wallet · Non-custodial · Your keys, your crypto · Keys never leave your device
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: { flex: 1 },
  headerBrand: { letterSpacing: 1, marginBottom: 6 },
  headerBrandXU: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  headerBrandWallet: { fontSize: 12, fontWeight: '300', color: Colors.textMuted },
  headerLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  headerValue: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  headerCurrency: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  networkToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  networkToggleTestnet: {
    backgroundColor: Colors.warning + '18',
    borderColor: Colors.warning + '50',
  },
  networkToggleMainnet: {
    backgroundColor: Colors.accent + '18',
    borderColor: Colors.accent + '50',
  },
  networkToggleText: { fontSize: 10, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent + '44',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  scrollContent: { gap: Spacing.md, paddingBottom: 20 },
  quickActionsWrap: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
  },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: Spacing.xs },
  actionBtn: { alignItems: 'center', gap: 6, minWidth: 56, paddingVertical: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  assetsCard: { marginHorizontal: Spacing.md },
  assetsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  assetsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assetsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  assetsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assetsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  assetsCount: { fontSize: 11, color: Colors.textMuted },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1,
  },
  modeBadgeTestnet: { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '40' },
  modeBadgeMainnet: { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '40' },
  modeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  assetsList: { paddingBottom: Spacing.xs },
  assetDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: Spacing.md },
  tokenDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: Spacing.md, marginTop: Spacing.xs },
  securityNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: Spacing.md,
  },
  securityNoteText: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', flex: 1 },
});
