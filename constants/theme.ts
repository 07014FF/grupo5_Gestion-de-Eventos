/**
 * Color system for Cultural Events App
 * Minimalist design with light greens and complementary colors
 */

import { Platform } from 'react-native';

// Netflix-inspired color palette with light green and white
const primaryGreen = '#00D084';      // Verde claro vibrante (estilo Netflix)
const secondaryGreen = '#00B872';    // Verde más profundo
const darkGreen = '#008F5A';         // Verde oscuro para acentos
const lightGreen = '#F0FDF4';        // Verde muy claro/fondo
const netflixBlack = '#141414';      // Negro Netflix para contraste
const netflixGray = '#2F2F2F';       // Gris oscuro Netflix
const accentWhite = '#FFFFFF';       // Blanco puro
const lightGray = '#F8FAFC';         // Gris muy claro
const mediumGray = '#64748B';        // Gris medio
const darkText = '#0F172A';          // Texto oscuro
const warningRed = '#EF4444';        // Rojo moderno
const successGreen = '#10B981';      // Verde éxito

export const Colors = {
  light: {
    // Colores principales Netflix-style
    primary: primaryGreen,
    secondary: secondaryGreen,
    accent: darkGreen,

    // Textos
    text: darkText,
    textSecondary: mediumGray,
    textLight: accentWhite,
    textMuted: '#94A3B8',

    // Fondos Netflix-inspired
    background: accentWhite,
    backgroundSecondary: lightGreen,
    backgroundDark: netflixBlack,
    surface: accentWhite,
    surfaceElevated: lightGray,

    // Estados
    success: successGreen,
    warning: '#F59E0B',
    error: warningRed,

    // Elementos de interfaz
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowStrong: 'rgba(0, 0, 0, 0.15)',

    // Navegación
    tint: primaryGreen,
    icon: mediumGray,
    iconActive: primaryGreen,

    // Botones estilo Netflix
    buttonPrimary: primaryGreen,
    buttonSecondary: netflixGray,
    buttonDanger: warningRed,
    buttonText: accentWhite,
    buttonOutline: primaryGreen,

    // Estados específicos del evento
    available: successGreen,
    soldOut: warningRed,
    pending: '#F59E0B',

    // Overlays y máscaras
    overlay: 'rgba(0, 208, 132, 0.8)',
    gradient: 'rgba(0, 208, 132, 0.6)',
  },
  dark: {
    // Colores principales Netflix dark mode
    primary: primaryGreen,
    secondary: secondaryGreen,
    accent: darkGreen,

    // Textos
    text: accentWhite,
    textSecondary: '#94A3B8',
    textLight: accentWhite,
    textMuted: '#64748B',

    // Fondos Netflix dark
    background: netflixBlack,
    backgroundSecondary: netflixGray,
    backgroundDark: '#0A0A0A',
    surface: netflixGray,
    surfaceElevated: '#3F3F3F',

    // Estados
    success: successGreen,
    warning: '#F59E0B',
    error: warningRed,

    // Elementos de interfaz
    border: '#374151',
    borderLight: '#4B5563',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.6)',

    // Navegación
    tint: primaryGreen,
    icon: '#9CA3AF',
    iconActive: primaryGreen,

    // Botones estilo Netflix dark
    buttonPrimary: primaryGreen,
    buttonSecondary: '#4B5563',
    buttonDanger: warningRed,
    buttonText: accentWhite,
    buttonOutline: primaryGreen,

    // Estados específicos del evento
    available: successGreen,
    soldOut: warningRed,
    pending: '#F59E0B',

    // Overlays y máscaras
    overlay: 'rgba(0, 208, 132, 0.9)',
    gradient: 'rgba(0, 208, 132, 0.8)',
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

// Sombras
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
