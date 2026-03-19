import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { getNetworks, NetworkId } from '../../constants/config';
import { useWallet } from '../../hooks/useWallet';

function formatPrice(price: number): string {
  if (!price || price === 0) return '--';
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

interface AssetRowProps {
  networkId: NetworkId;
  onPress: (networkId: NetworkId) => void;
}

export const AssetRow = memo(({ networkId, onPress }: AssetRowProps) => {
  const { balances, prices, priceChanges, isTestnet } = useWallet();
  const activeNetworks = getNetworks(isTestnet);
  const network = activeNetworks[networkId];
  const balance = balances[networkId];

  const coinId = network.coinGeckoId as string;
  const livePrice = prices[coinId] ?? 0;
  const change24h = priceChanges[coinId] ?? null;
  const isPositive = change24h !== null && change24h >= 0;
  const changeColor = change24h === null
    ? Colors.textMuted
    : isPositive ? Colors.success : Colors.error;

  return (
    <Pressable
      onPress={() => onPress(networkId)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconBg, { backgroundColor: network.color + '18', borderColor: network.color + '40' }]}>
        <Image
          source={{ uri: network.logoUrl }}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{network.symbol}</Text>
          {change24h !== null && (
            <View style={[styles.changeBadge, { backgroundColor: changeColor + '20' }]}>
              <MaterialIcons
                name={isPositive ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={12}
                color={changeColor}
              />
              <Text style={[styles.changeText, { color: changeColor }]}>
                {Math.abs(change24h).toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.network}>{network.name}</Text>
        {livePrice > 0 && (
          <Text style={styles.livePrice}>{formatPrice(livePrice)}</Text>
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.balance}>{balance?.balance || '0.000000'}</Text>
        <Text style={styles.usd}>${balance?.usdValue || '0.00'}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radii.md,
  },
  pressed: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.8,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  logo: {
    width: 28,
    height: 28,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.full,
    gap: 1,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  network: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  livePrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  balance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  usd: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
