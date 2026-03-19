import React, { memo } from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getNetworks, NetworkId } from '../../constants/config';
import { Colors, Radii, Spacing } from '../../constants/theme';
import { useWallet } from '../../hooks/useWallet';

export const NetworkSelector = memo(() => {
  const { selectedNetwork, setSelectedNetwork, isTestnet } = useWallet();
  const activeNetworks = getNetworks(isTestnet);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {(Object.keys(activeNetworks) as NetworkId[]).map((networkId) => {
          const network = activeNetworks[networkId];
          const isSelected = selectedNetwork === networkId;
          return (
            <Pressable
              key={networkId}
              onPress={() => setSelectedNetwork(networkId)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && { backgroundColor: network.color + '22', borderColor: network.color },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.logoContainer, { borderColor: network.color + '44' }]}>
                <Image
                  source={{ uri: network.logoUrl }}
                  style={styles.logo}
                  contentFit="contain"
                  transition={200}
                />
              </View>
              <Text style={[styles.label, isSelected && { color: network.color }]}>
                {network.symbol}
              </Text>
              {isSelected && (
                <View style={[styles.activeDot, { backgroundColor: network.color }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 56,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    height: 42,
  },
  pressed: {
    opacity: 0.7,
  },
  logoContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  logo: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
