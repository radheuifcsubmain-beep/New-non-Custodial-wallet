import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../hooks/useWallet';
import { Radii, Spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'shield' as const, label: 'Bank-grade security' },
  { icon: 'vpn-key' as const, label: 'You control your keys' },
  { icon: 'account-balance-wallet' as const, label: 'Manage multiple assets' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, hasWallet } = useWallet();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const cardSlide = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (isLoaded && hasWallet) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, hasWallet]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 50, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!isLoaded) return null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#7C3AED', '#4D49FC', '#0EA5E9', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Soft overlay blobs */}
      <View style={[styles.blob, { top: -60, left: -60, backgroundColor: 'rgba(124,58,237,0.35)' }]} />
      <View style={[styles.blob, { bottom: 120, right: -80, backgroundColor: 'rgba(6,182,212,0.25)', width: 280, height: 280 }]} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === 'web' ? 60 : 20) }]}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: fadeAnim }]}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>XU Wallet</Text>
          <Text style={styles.subtitle}>Secure. Decentralized. Non-Custodial.</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.features, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={f.icon} size={18} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom action card */}
      <Animated.View style={[styles.card, { transform: [{ translateY: cardSlide }], paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          onPress={() => router.push('/create')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Create New Wallet</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/import')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
        >
          <MaterialIcons name="file-download" size={20} color="#333" />
          <Text style={styles.secondaryBtnText}>Import Existing Wallet</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Your keys, your crypto. We never store your private keys.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  logoWrap: {
    marginTop: Spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  features: {
    width: '100%',
    gap: 14,
    paddingHorizontal: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  primaryBtn: {
    height: 54,
    backgroundColor: '#4D49FC',
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4D49FC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
