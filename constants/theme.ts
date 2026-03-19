export const Colors = {
  // Gradient palette (Figma brand)
  gradientStart: '#7C3AED',
  gradientMid: '#4D49FC',
  gradientEnd: '#06B6D4',

  // Base surfaces — deep navy/indigo dark
  background: '#0B0B1E',
  surface: '#13132B',
  surfaceElevated: '#1C1C3A',
  surfaceBorder: '#2A2A50',
  cardGlass: 'rgba(28, 28, 58, 0.92)',

  // Brand
  primary: '#4D49FC',
  primaryDim: 'rgba(77, 73, 252, 0.18)',
  secondary: '#7C3AED',
  secondaryDim: 'rgba(124, 58, 237, 0.18)',
  accent: '#06B6D4',
  accentDim: 'rgba(6, 182, 212, 0.15)',

  // Semantic
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#4D49FC',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C0',
  textMuted: '#5A6080',
  textInverse: '#FFFFFF',

  // Network tokens
  ethereum: '#627EEA',
  bsc: '#F3BA2F',
  polygon: '#8247E5',
  solana: '#9945FF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600' as const, color: Colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  mono: { fontSize: 14, fontFamily: 'monospace', color: Colors.textPrimary },
};
