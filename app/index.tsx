import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, Radii } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { CHAIN_LOGOS } from '../constants/config';

const { width } = Dimensions.get('window');

const CHAIN_LIST = [
  { key: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', logo: CHAIN_LOGOS.ethereum },
  { key: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F', logo: CHAIN_LOGOS.bsc },
  { key: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5', logo: CHAIN_LOGOS.polygon },
  { key: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF', logo: CHAIN_LOGOS.solana },
];

const SECURITY_FEATURES = [
  { icon: 'lock', label: 'Non-Custodial' },
  { icon: 'verified-user', label: 'BIP-39 Standard' },
  { icon: 'security', label: 'Device Encrypted' },
  { icon: 'fingerprint', label: 'Biometric Auth' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, hasWallet } = useWallet();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoaded && hasWallet) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, hasWallet]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  if (!isLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background grid pattern */}
      <View style={styles.gridBg} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: i * 90 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.gridLineV, { left: i * (width / 5) }]} />
        ))}
      </View>

      {/* Top accent bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarDot} />
        <Text style={styles.topBarText}>XU WALLET · ENTERPRISE GRADE</Text>
        <View style={styles.topBarDot} />
      </View>

      {/* Hero section */}
      <View style={styles.heroSection}>
        {/* Glow ring behind logo */}
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            contentFit="contain"
            transition={300}
          />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>XU</Text>
            <Text style={styles.brandNameLight}> WALLET</Text>
          </View>
          <Text style={styles.brandTagline}>MULTI-CHAIN · NON-CUSTODIAL · ENTERPRISE</Text>
        </Animated.View>
      </View>

      {/* Chain logos strip */}
      <Animated.View style={[styles.chainStrip, { opacity: fadeAnim }]}>
        {CHAIN_LIST.map((chain) => (
          <View key={chain.key} style={styles.chainItem}>
            <View style={[styles.chainLogoWrap, { borderColor: chain.color + '60', backgroundColor: chain.color + '15' }]}>
              <Image source={{ uri: chain.logo }} style={styles.chainLogo} contentFit="contain" />
            </View>
            <Text style={styles.chainSymbol}>{chain.symbol}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Divider */}
      <View style={styles.dividerLine}>
        <View style={styles.dividerSegment} />
        <Text style={styles.dividerText}>SECURE YOUR ASSETS</Text>
        <View style={styles.dividerSegment} />
      </View>

      {/* Security features grid */}
      <Animated.View style={[styles.securityGrid, { opacity: fadeAnim }]}>
        {SECURITY_FEATURES.map((feat) => (
          <View key={feat.label} style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <MaterialIcons name={feat.icon as any} size={16} color={Colors.primary} />
            </View>
            <Text style={styles.securityLabel}>{feat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim, paddingBottom: insets.bottom + 16 }]}>
        {/* Primary — Create Wallet */}
        <Pressable
          onPress={() => router.push('/create')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <View style={styles.primaryBtnInner}>
            <View style={styles.primaryBtnLeft}>
              <MaterialIcons name="add-circle" size={22} color={Colors.textInverse} />
              <View>
                <Text style={styles.primaryBtnTitle}>Create New Wallet</Text>
                <Text style={styles.primaryBtnSub}>Generate a fresh BIP-39 seed phrase</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textInverse + 'aa'} />
          </View>
        </Pressable>

        {/* Secondary — Import Wallet */}
        <Pressable
          onPress={() => router.push('/import')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
        >
          <View style={styles.primaryBtnInner}>
            <View style={styles.primaryBtnLeft}>
              <MaterialIcons name="file-download" size={22} color={Colors.primary} />
              <View>
                <Text style={styles.secondaryBtnTitle}>Import with Seed Phrase</Text>
                <Text style={styles.secondaryBtnSub}>Restore an existing wallet (12/24 words)</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.primary + 'aa'} />
          </View>
        </Pressable>

        {/* Disclaimer row */}
        <View style={styles.disclaimer}>
          <MaterialIcons name="lock" size={12} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Private keys are stored securely on this device only · Open Source · Auditable
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  gridBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: Colors.primary + '08',
  },
  gridLineV: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: Colors.primary + '08',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  topBarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  topBarText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  glowRing: {
    position: 'absolute',
    top: Spacing.xl - 20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 30,
    opacity: 0.5,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  brandNameLight: {
    fontSize: 42,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  chainStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  chainItem: {
    alignItems: 'center',
    gap: 5,
  },
  chainLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chainLogo: {
    width: 30,
    height: 30,
  },
  chainSymbol: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  dividerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dividerSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  dividerText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  securityItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  securityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  actions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    marginTop: 'auto',
  },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  primaryBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  primaryBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  primaryBtnSub: {
    fontSize: 11,
    color: Colors.textInverse + 'bb',
    marginTop: 2,
  },

  secondaryBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    overflow: 'hidden',
  },
  secondaryBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  secondaryBtnSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 4,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
});
