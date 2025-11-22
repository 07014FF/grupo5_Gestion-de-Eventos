/**
 * Color system for Cultural Events App
 * Modern, elegant design with vibrant colors and smooth gradients
 */

import { Platform } from 'react-native';

// Premium color palette - Fresh Green Theme (Restored)
const primary = '#00D084';           // Verde claro vibrante
const primaryLight = '#4ADE80';      // Verde lima claro
const primaryDark = '#059669';       // Verde esmeralda
const secondary = '#10B981';         // Verde secundario
const secondaryLight = '#6EE7B7';    // Verde agua claro
const accent = '#14B8A6';            // Turquesa
const accentLight = '#5EEAD4';       // Turquesa claro

// Neutrales modernos
const white = '#FFFFFF';
const black = '#0A0A0A';
const gray50 = '#FAFAFA';
const gray100 = '#F4F4F5';
const gray200 = '#E4E4E7';
const gray300 = '#D4D4D8';
const gray400 = '#A1A1AA';
const gray500 = '#71717A';
const gray600 = '#52525B';
const gray700 = '#3F3F46';
const gray800 = '#27272A';
const gray900 = '#18181B';

// Estados
const success = '#10B981';
const warning = '#F59E0B';
const error = '#EF4444';
const info = '#3B82F6';

export const Colors = {
  light: {
    // Colores principales - Vibrantes y modernos
    primary: primary,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    secondary: secondary,
    secondaryLight: secondaryLight,
    accent: accent,
    accentLight: accentLight,

    // Textos - Alto contraste y legibilidad
    text: gray900,
    textSecondary: gray600,
    textLight: white,
    textMuted: gray400,

    // Colores básicos
    white: white,
    black: black,

    // Fondos - Limpios y espaciosos
    background: white,
    backgroundSecondary: gray50,
    backgroundDark: gray900,
    surface: white,
    surfaceElevated: gray50,
    surfaceHover: gray100,

    // Estados
    success: success,
    warning: warning,
    error: error,
    info: info,

    // Elementos de interfaz
    border: gray200,
    borderLight: gray100,
    borderStrong: gray300,
    shadow: 'rgba(0, 0, 0, 0.05)',
    shadowStrong: 'rgba(0, 0, 0, 0.1)',

    // Navegación
    tint: primary,
    icon: gray500,
    iconActive: primary,

    // Botones - Más atractivos
    buttonPrimary: primary,
    buttonPrimaryHover: primaryDark,
    buttonSecondary: gray100,
    buttonSecondaryHover: gray200,
    buttonDanger: error,
    buttonText: white,
    buttonOutline: primary,

    // Estados específicos del evento
    available: success,
    soldOut: error,
    pending: warning,

    // Overlays y gradientes mejorados
    overlay: 'rgba(0, 208, 132, 0.85)',
    overlayDark: 'rgba(10, 10, 10, 0.6)',
    gradient: ['#00D084', '#10B981'],
    gradientSubtle: ['#4ADE80', '#6EE7B7'],
  },
  dark: {
    // Colores principales - Vibrantes en modo oscuro
    primary: '#00D084',          // Verde principal más brillante
    primaryLight: '#4ADE80',     // Verde claro
    primaryDark: '#059669',      // Verde oscuro
    secondary: '#10B981',
    secondaryLight: '#6EE7B7',
    accent: '#14B8A6',
    accentLight: '#5EEAD4',

    // Textos - ALTO CONTRASTE para legibilidad
    text: '#FFFFFF',             // Blanco puro para títulos
    textSecondary: '#E4E4E7',    // Gris muy claro (mejor contraste)
    textLight: '#FFFFFF',
    textMuted: '#A1A1AA',        // Gris medio (mejor que antes)

    // Colores básicos
    white: white,
    black: black,

    // Fondos - Mejor separación visual estilo Notion/Stripe
    background: '#0A0A0A',       // Negro profundo
    backgroundSecondary: '#1A1A1C', // Gris oscuro con mejor contraste
    backgroundDark: '#000000',
    surface: '#1F1F23',          // Superficie elevada con buen contraste
    surfaceElevated: '#27272A',  // Más clara para destacar
    surfaceHover: '#3F3F46',     // Hover visible

    // Estados
    success: success,
    warning: warning,
    error: error,
    info: info,

    // Elementos de interfaz
    border: gray700,
    borderLight: gray800,
    borderStrong: gray600,
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',

    // Navegación
    tint: primaryLight,
    icon: gray400,
    iconActive: primaryLight,

    // Botones - Destacados en oscuro
    buttonPrimary: primary,
    buttonPrimaryHover: primaryDark,
    buttonSecondary: gray800,
    buttonSecondaryHover: gray700,
    buttonDanger: error,
    buttonText: white,
    buttonOutline: primaryLight,

    // Estados específicos del evento
    available: success,
    soldOut: error,
    pending: warning,

    // Overlays y gradientes mejorados
    overlay: 'rgba(0, 208, 132, 0.9)',
    overlayDark: 'rgba(0, 0, 0, 0.8)',
    gradient: ['#4ADE80', '#6EE7B7'],
    gradientSubtle: ['#00D084', '#10B981'],
  },
};

// Tipografía consistente
export const Fonts = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    light: 'Roboto-Light',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
});

// Tamaños de fuente
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,
};

// Espaciado consistente
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Radios de bordes
export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
  full: 9999, // Para bordes completamente circulares
};

// Sombras - Más suaves y elegantes (Green Theme)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  xl: {
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 15,
  },
};

// Estilos de botones predefinidos
export const ButtonStyles = {
  primary: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondary: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

// Colores específicos para Admin Panel - Inspirado en Stripe/Notion/Airbnb
export const AdminColors = {
  // Backgrounds con mejor contraste
  cardBackground: '#1F1F23',           // Cards elevados
  cardBackgroundHover: '#27272A',      // Hover state
  sectionBackground: '#1A1A1C',        // Secciones
  divider: 'rgba(255, 255, 255, 0.08)', // Divisores sutiles

  // Textos con máximo contraste
  headingPrimary: '#FFFFFF',           // Títulos principales
  headingSecondary: '#E4E4E7',         // Subtítulos
  bodyPrimary: '#E4E4E7',              // Texto normal
  bodySecondary: '#A1A1AA',            // Texto secundario
  caption: '#71717A',                  // Captions y labels

  // Botones con alto contraste
  buttonPrimaryBg: '#00D084',
  buttonPrimaryHover: '#10B981',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#27272A',
  buttonSecondaryHover: '#3F3F46',
  buttonSecondaryText: '#E4E4E7',

  // Bordes visibles
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
};

// Sistema de gradientes para Admin Panel (Green Theme)
export const AdminGradients = {
  header: ['#00D084', '#10B981', '#14B8A6'] as const,

  stats: {
    events: ['#00D084', '#059669'] as const,
    tickets: ['#10B981', '#047857'] as const,
    revenue: ['#14B8A6', '#0D9488'] as const,
    pending: ['#F59E0B', '#D97706'] as const,
  },

  actions: {
    create: ['#00D084', '#10B981'] as const,
    scan: ['#14B8A6', '#10B981'] as const,
    reports: ['#10B981', '#F59E0B'] as const,
    users: ['#00D084', '#14B8A6'] as const,
  },

  charts: {
    revenue: ['#00D084', 'transparent'] as const,
    tickets: ['#10B981', 'transparent'] as const,
    events: ['#14B8A6', 'transparent'] as const,
  },
};

// Efectos visuales para Admin (Green Theme)
export const AdminEffects = {
  glassmorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },

  glassmorphismLight: {
    backgroundColor: 'rgba(0, 208, 132, 0.03)',
    borderColor: 'rgba(0, 208, 132, 0.1)',
    borderWidth: 1,
  },

  glow: {
    shadowColor: '#00D084',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

// Espaciado específico para Admin
export const AdminSpacing = {
  section: 32,
  cardGroup: 16,
  cardInternal: 20,
  elementSmall: 12,
  heroHeight: 200,
};

// Tamaños de fuente para Admin
export const AdminFontSizes = {
  heroTitle: 32,
  heroSubtitle: 16,
  statValue: 36,
  statLabel: 14,
  cardTitle: 18,
  sectionTitle: 22,
};
