import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorBoundaryFallback = ({
  onRetry,
  error,
  errorInfo,
}: {
  onRetry: () => void;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}) => {
  // Use system color scheme directly instead of context
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const styles = React.useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.background}
        translucent={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="warning" size={56} color={palette.error} />
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.subtitle}>
            La aplicación encontró un error inesperado. Puedes intentar recargar la pantalla.
          </Text>
        </View>

        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="bug" size={18} color={palette.warning} />
            <Text style={styles.errorHeaderText}>Detalles técnicos</Text>
          </View>
          <Text style={styles.errorMessage}>
            {error?.message || error?.toString() || 'Error desconocido'}
          </Text>

          {__DEV__ && errorInfo?.componentStack ? (
            <View style={styles.stackSection}>
              <View style={styles.errorHeader}>
                <Ionicons name="code-slash" size={18} color={palette.textSecondary} />
                <Text style={styles.errorHeaderText}>Stack trace</Text>
              </View>
              <ScrollView style={styles.stackScroll} horizontal>
                <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View style={styles.hintsCard}>
          <Ionicons name="information-circle" size={20} color={palette.primary} />
          <Text style={styles.hintsTitle}>Sugerencias</Text>
          <View style={styles.hintList}>
            <Text style={styles.hintItem}>• Verifica tu conexión a internet</Text>
            <Text style={styles.hintItem}>• Cierra y vuelve a abrir la aplicación</Text>
            <Text style={styles.hintItem}>• Contacta soporte si el problema persiste</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh" size={22} color={palette.buttonText} />
          <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          onRetry={this.handleRetry}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

const createStyles = (palette: typeof Colors.dark, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDark
        ? 'rgba(239, 68, 68, 0.15)'
        : 'rgba(239, 68, 68, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: '800',
      color: palette.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSizes.md,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: Spacing.md,
    },
    errorCard: {
      backgroundColor: isDark ? palette.surface : palette.surfaceElevated,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(239, 68, 68, 0.25)'
        : 'rgba(239, 68, 68, 0.15)',
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    errorHeaderText: {
      fontSize: FontSizes.sm,
      fontWeight: '700',
      color: palette.text,
      letterSpacing: 0.6,
    },
    errorMessage: {
      fontSize: FontSizes.md,
      color: palette.error,
      lineHeight: 22,
      backgroundColor: isDark
        ? 'rgba(239, 68, 68, 0.12)'
        : 'rgba(239, 68, 68, 0.08)',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      fontFamily: 'monospace',
    },
    stackSection: {
      marginTop: Spacing.md,
    },
    stackScroll: {
      maxHeight: 200,
      marginTop: Spacing.xs,
    },
    stackText: {
      fontSize: FontSizes.xs,
      color: palette.textSecondary,
      lineHeight: 18,
      fontFamily: 'monospace',
      backgroundColor: isDark
        ? 'rgba(148, 163, 184, 0.12)'
        : 'rgba(148, 163, 184, 0.08)',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      minWidth: 300,
    },
    hintsCard: {
      backgroundColor: isDark
        ? 'rgba(0, 208, 132, 0.12)'
        : 'rgba(0, 208, 132, 0.1)',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(0, 208, 132, 0.2)'
        : 'rgba(0, 208, 132, 0.15)',
    },
    hintsTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: palette.primary,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    hintList: {
      gap: Spacing.xs,
    },
    hintItem: {
      fontSize: FontSizes.sm,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    actions: {
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: isDark ? palette.background : palette.surface,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: palette.buttonPrimary,
    },
    retryButtonText: {
      color: palette.buttonText,
      fontSize: FontSizes.md,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  });

export default ErrorBoundary;
