import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { getNetworks, NetworkId } from '../../constants/config';
import { useWallet } from '../../hooks/useWallet';

interface BalanceCardProps {
  onRefresh?: () => void;
}

export const BalanceCard = memo(({ onRefresh }: BalanceCardProps) => {
  const { selectedNetwork, balances, totalUSD, isLoadingBalances, getCurrentAddress, isTestnet } = useWallet();
  const activeNetworks = getNetworks(isTestnet);
  const network = activeNetworks[selectedNetwork];
  const balance = balances[selectedNetwork];
  const address = getCurrentAddress();

  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : 'Loading...';

  return (
    <View style={[styles.card, { borderColor: network.color + '44' }]}>
      <View style={styles.header}>
        <View style={[styles.networkBadge, { backgroundColor: network.color + '18', borderColor: network.color + '44' }]}>
          <View style={styles.logoWrap}>
            <Image
              source={{ uri: network.logoUrl }}
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
          </View>
          <Text style={[styles.networkName, { color: network.color }]}>
            {network.name}
          </Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshBtn} hitSlop={8}>
          {isLoadingBalances ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />
          )}
        </Pressable>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceAmount}>
          {isLoadingBalances ? '---' : (balance?.balance || '0.000000')}
        </Text>
        <Text style={styles.balanceSymbol}>{network.symbol}</Text>
      </View>
      <Text style={styles.usdValue}>
        ≈ ${isLoadingBalances ? '--' : (balance?.usdValue || '0.00')} USD
      </Text>

      <View style={styles.divider} />
      <View style={styles.portfolioRow}>
        <Text style={styles.portfolioLabel}>Total Portfolio</Text>
        <Text style={styles.portfolioValue}>${isLoadingBalances ? '--' : totalUSD}</Text>
      </View>

      <View style={styles.addressRow}>
        <MaterialIcons name="account-balance-wallet" size={14} color={Colors.textMuted} />
        <Text style={styles.address} numberOfLines={1}>{shortAddress}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  logoWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logo: {
    width: 20,
    height: 20,
  },
  networkName: {
    fontSize: 13,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  balanceSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  usdValue: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.sm,
  },
  portfolioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  portfolioLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  portfolioValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    flex: 1,
  },
});
