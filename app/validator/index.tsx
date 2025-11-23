/**
 * Pantalla principal del Validador de Entradas
 * UI/UX mejorado con animaciones, gradientes y diseño moderno
 */

import { ManualCodeInput } from '@/components/validator/ManualCodeInput';
import { QRScanner } from '@/components/validator/QRScanner';
import { ValidationResult } from '@/components/validator/ValidationResult';
import { ValidatorStats } from '@/components/validator/ValidatorStats';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ValidatorService } from '@/services/validator.service';
import type {
  TicketValidation,
  ValidationResult as ValidationResultType,
  ValidatorEvent,
  ValidatorStats as ValidatorStatsType,
} from '@/types/validator.types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ViewMode = 'scanner' | 'manual' | 'stats';

const ALLOWED_ROLES = ['admin', 'super_admin', 'qr_validator'];

export default function ValidatorScreen() {
  const { user, logout } = useAuth();
  const userRole = user?.role ?? '';
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = getStyles(colors);

  // Estados principales
  const [viewMode, setViewMode] = useState<ViewMode>('scanner');
  const [selectedEvent, setSelectedEvent] = useState<ValidatorEvent | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);

  // Estados de datos
  const [events, setEvents] = useState<ValidatorEvent[]>([]);
  const [stats, setStats] = useState<ValidatorStatsType | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResultType | null>(null);
  const [recentValidations, setRecentValidations] = useState<TicketValidation[]>([]);

  // Estados de UI
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Estados de sincronización
  const [pendingValidations, setPendingValidations] = useState(0);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;

    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso para sync badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // ==================================================================
  // CARGA DE DATOS
  // ==================================================================
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    const result = await ValidatorService.getValidatorEvents();

    if (isMounted.current) {
      if (result.success) {
        setEvents(result.data);
        const activeEvent = result.data.find((e: ValidatorEvent) => e.isActive);
        if (activeEvent && !selectedEvent) {
          setSelectedEvent(activeEvent);
        }
      }
      setIsLoadingEvents(false);
    }
  }, [selectedEvent]);

  const loadStats = useCallback(async () => {
    if (!selectedEvent) return;

    setIsLoadingStats(true);
    const result = await ValidatorService.getValidatorStats(selectedEvent.id);

    if (isMounted.current) {
      if (result.success) {
        setStats(result.data);
      }
      setIsLoadingStats(false);
    }
  }, [selectedEvent]);

  const loadRecentValidations = useCallback(async () => {
    if (!selectedEvent) return;
    const result = await ValidatorService.getRecentValidations(selectedEvent.id);
    if (isMounted.current && result.success) {
      setRecentValidations(result.data);
    }
  }, [selectedEvent]);

  const checkPendingValidations = useCallback(async () => {
    const offline = await ValidatorService.getOfflineValidations();
    if (isMounted.current) {
      setPendingValidations(offline.filter((v: any) => !v.synced).length);
    }
  }, []);

  useEffect(() => {
    if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
      Alert.alert(
        'Acceso Denegado',
        'Solo los administradores y validadores pueden acceder',
        [
          {
            text: 'OK',
            onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
          },
        ]
      );
      return;
    }

    loadEvents();
    checkPendingValidations();
  }, [userRole, loadEvents, checkPendingValidations]);

  useEffect(() => {
    if (selectedEvent) {
      loadStats();
      loadRecentValidations();
    }
  }, [selectedEvent, loadStats, loadRecentValidations]);

  // ==================================================================
  // VALIDACIÓN
  // ==================================================================

  const handleValidateTicket = useCallback(
    async (code: string) => {
      if (!selectedEvent) {
        Alert.alert('Error', 'Selecciona un evento primero');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      setIsProcessing(true);

      const result = await ValidatorService.validateTicket(
        code,
        selectedEvent.id,
        user.id,
        user.email || 'Validador'
      );

      if (isMounted.current) {
        setIsProcessing(false);

        if (result.success) {
          setValidationResult(result.data);
          setShowResult(true);

          setTimeout(() => {
            if (isMounted.current) {
              loadStats();
              loadRecentValidations();
              checkPendingValidations();
            }
          }, 1000);
        } else {
          Alert.alert('Error', result.error.getUserMessage());
        }
      }
    },
    [selectedEvent, user, loadStats, checkPendingValidations, loadRecentValidations]
  );

  const handleCloseResult = useCallback(() => {
    setShowResult(false);
    setTimeout(() => {
      if (isMounted.current) {
        setValidationResult(null);
      }
    }, 300);
  }, []);

  // ==================================================================
  // SINCRONIZACIÓN
  // ==================================================================

  const handleSync = useCallback(async () => {
    Alert.alert(
      'Sincronizar',
      `¿Deseas sincronizar ${pendingValidations} validación(es) pendiente(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            const result = await ValidatorService.syncOfflineValidations();
            if (result.success) {
              Alert.alert(
                'Sincronización Completa',
                `Se sincronizaron ${result.data} validación(es)`
              );
              checkPendingValidations();
              loadStats();
            } else {
              Alert.alert('Error', 'No se pudo sincronizar');
            }
          },
        },
      ]
    );
  }, [pendingValidations, checkPendingValidations, loadStats]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  }, [logout]);

  // ==================================================================
  // RENDERIZADO
  // ==================================================================

  const renderEventSelector = useCallback(
    () => (
      <Modal
        visible={showEventSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Evento</Text>
              <TouchableOpacity onPress={() => setShowEventSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingEvents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.eventItem,
                        selectedEvent?.id === item.id && styles.eventItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedEvent(item);
                        setShowEventSelector(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.eventItemHeader}>
                        <View style={styles.eventIconContainer}>
                          <Ionicons name="calendar" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.eventItemContent}>
                          <Text style={styles.eventItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.eventItemMeta}>
                            <Ionicons name="location" size={14} color={colors.textSecondary} />
                            <Text style={styles.eventItemMetaText} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        </View>
                        {selectedEvent?.id === item.id && (
                          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                        )}
                      </View>
                      <View style={styles.eventItemFooter}>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${(item.validatedCount / item.capacity) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.eventItemProgressText}>
                          {item.validatedCount} / {item.capacity} validados
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                contentContainerStyle={styles.eventList}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    ),
    [
      showEventSelector,
      isLoadingEvents,
      events,
      selectedEvent,
      styles,
      colors,
      fadeAnim,
    ]
  );

  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 100 }} size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎫 Centro de Validación</Text>
          {selectedEvent && (
            <TouchableOpacity
              style={styles.eventSelector}
              onPress={() => setShowEventSelector(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.eventSelectorText} numberOfLines={1}>
                {selectedEvent.title}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          {/* Indicador de sincronización con pulso */}
          {pendingValidations > 0 && (
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="cloud-upload" size={20} color={colors.white} />
              </Animated.View>
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{pendingValidations}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Botón de cerrar sesión */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contenido con animación */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {!selectedEvent ? (
          <View style={styles.noEventContainer}>
            <View style={styles.noEventIconContainer}>
              <Ionicons name="calendar-outline" size={80} color={colors.primary} />
            </View>
            <Text style={styles.noEventTitle}>Sin Evento Seleccionado</Text>
            <Text style={styles.noEventText}>
              Selecciona un evento para comenzar a validar entradas
            </Text>
            <TouchableOpacity
              style={styles.selectEventButton}
              onPress={() => setShowEventSelector(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00D084', '#00B875']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.white} />
                <Text style={styles.selectEventButtonText}>Seleccionar Evento</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hubContainer}>
            {/* Estadísticas con animación */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <ValidatorStats
                stats={stats}
                isLoading={isLoadingStats}
                onRefresh={loadStats}
              />
            </Animated.View>

            {/* Acciones principales con efecto glassmorphism */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.mainActionButton}
                onPress={() => setViewMode('scanner')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00D084', '#00B875']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainActionGradient}
                >
                  <View style={styles.scanIconContainer}>
                    <Ionicons name="qr-code" size={40} color={colors.white} />
                  </View>
                  <Text style={styles.mainActionButtonText}>Escanear QR</Text>
                  <Text style={styles.mainActionButtonSubtext}>
                    Validación rápida y segura
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setViewMode('manual')}
                activeOpacity={0.7}
              >
                <Ionicons name="keypad-outline" size={20} color={colors.primary} />
                <Text style={styles.secondaryActionButtonText}>
                  Ingresar código manualmente
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Actividad Reciente con mejor diseño */}
            <View style={styles.recentActivityContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={styles.recentActivityTitle}>Actividad Reciente</Text>
              </View>

              {recentValidations.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="list-outline" size={56} color={colors.textSecondary} />
                  <Text style={styles.emptyStateTitle}>Sin validaciones aún</Text>
                  <Text style={styles.emptyStateText}>
                    Las validaciones aparecerán aquí en tiempo real
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={recentValidations}
                  keyExtractor={(item, index) => `${item.validatedAt}-${index}`}
                  renderItem={({ item, index }) => (
                    <Animated.View
                      style={{
                        opacity: fadeAnim,
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 0],
                          }),
                        }],
                      }}
                    >
                      <RecentValidationItem item={item} colors={colors} />
                    </Animated.View>
                  )}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Modal para el Scanner */}
      <Modal
        visible={viewMode === 'scanner'}
        animationType="slide"
        onRequestClose={() => setViewMode('stats')}
      >
        <QRScanner
          onScan={handleValidateTicket}
          isProcessing={isProcessing}
          onCancel={() => setViewMode('stats')}
        />
      </Modal>

      {/* Modal para Entrada Manual */}
      <Modal
        visible={viewMode === 'manual'}
        transparent
        animationType="fade"
        onRequestClose={() => setViewMode('stats')}
      >
        <View style={styles.manualInputOverlay}>
          <ManualCodeInput
            onSubmit={handleValidateTicket}
            isProcessing={isProcessing}
            onCancel={() => setViewMode('stats')}
          />
        </View>
      </Modal>

      {/* Modal de resultado */}
      <ValidationResult
        visible={showResult}
        result={validationResult}
        onClose={handleCloseResult}
      />

      {/* Modal de selector de eventos */}
      {renderEventSelector()}
    </View>
  );
}

// Componente para item de la lista de actividad reciente - MEJORADO
const RecentValidationItem = ({ item, colors }: { item: TicketValidation; colors: any }) => {
  const icon = item.status === 'valid' ? 'checkmark-circle' : 'close-circle';
  const iconColor = item.status === 'valid' ? colors.success : colors.error;
  const time = new Date(item.validatedAt).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={itemStyles(colors).container}
      >
        <View style={itemStyles(colors).iconContainer}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
        <View style={itemStyles(colors).info}>
          <Text style={itemStyles(colors).userName} numberOfLines={1}>
            {item.userName}
          </Text>
          <View style={itemStyles(colors).ticketTypeContainer}>
            <Ionicons name="ticket-outline" size={14} color={colors.textSecondary} />
            <Text style={itemStyles(colors).ticketType}>
              {item.ticketType}
            </Text>
          </View>
        </View>
        <View style={itemStyles(colors).timeContainer}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={itemStyles(colors).time}>{time}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Estilos para RecentValidationItem - MEJORADOS
const itemStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(0, 208, 132, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    info: {
      flex: 1,
      marginHorizontal: Spacing.md,
    },
    userName: {
      color: colors.text,
      fontWeight: '600',
      fontSize: FontSizes.md,
      marginBottom: Spacing.xs / 2,
    },
    ticketTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs / 2,
    },
    ticketType: {
      color: colors.textSecondary,
      fontSize: FontSizes.sm,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs / 2,
      backgroundColor: 'rgba(0, 208, 132, 0.05)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.sm,
    },
    time: {
      color: colors.textSecondary,
      fontSize: FontSizes.xs,
      fontWeight: '600',
    },
  });

const getStyles = (colors: (typeof Colors)['dark']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      gap: Spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    eventSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.xs,
      paddingVertical: Spacing.xs / 2,
    },
    eventSelectorText: {
      fontSize: FontSizes.sm,
      color: colors.primary,
      fontWeight: '600',
      maxWidth: 200,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    syncButton: {
      backgroundColor: colors.primary,
      width: 48,
      height: 48,
      borderRadius: BorderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    logoutButton: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    syncBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.error,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    syncBadgeText: {
      fontSize: FontSizes.xs,
      color: colors.white,
      fontWeight: '800',
    },
    content: {
      flex: 1,
    },
    hubContainer: {
      flex: 1,
      padding: Spacing.lg,
    },
    actionsContainer: {
      marginVertical: Spacing.xl,
    },
    mainActionButton: {
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      shadowColor: '#00D084',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    mainActionGradient: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    scanIconContainer: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    mainActionButtonText: {
      color: colors.white,
      fontSize: FontSizes.xl,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    mainActionButtonSubtext: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: FontSizes.sm,
      fontWeight: '500',
      marginTop: Spacing.xs / 2,
    },
    secondaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: 'rgba(0, 208, 132, 0.05)',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(0, 208, 132, 0.2)',
      gap: Spacing.sm,
    },
    secondaryActionButtonText: {
      color: colors.primary,
      fontSize: FontSizes.md,
      fontWeight: '600',
      flex: 1,
    },
    recentActivityContainer: {
      flex: 1,
      marginTop: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    recentActivityTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '700',
      color: colors.text,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xxxl,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      borderStyle: 'dashed',
    },
    emptyStateTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: colors.text,
      marginTop: Spacing.md,
    },
    emptyStateText: {
      marginTop: Spacing.xs,
      color: colors.textSecondary,
      fontSize: FontSizes.sm,
      textAlign: 'center',
      maxWidth: 250,
    },
    noEventContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    noEventIconContainer: {
      width: 140,
      height: 140,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(0, 208, 132, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    noEventTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    noEventText: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 22,
    },
    selectEventButton: {
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      shadowColor: '#00D084',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    gradientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    selectEventButtonText: {
      color: colors.white,
      fontSize: FontSizes.lg,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      maxHeight: '80%',
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: colors.text,
    },
    loadingContainer: {
      padding: Spacing.xxxl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventList: {
      padding: Spacing.lg,
    },
    eventItem: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    eventItemSelected: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(0, 208, 132, 0.1)',
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
    },
    eventItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    eventIconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(0, 208, 132, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventItemContent: {
      flex: 1,
    },
    eventItemTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.xs / 2,
    },
    eventItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs / 2,
    },
    eventItemMetaText: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
      flex: 1,
    },
    eventItemFooter: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.sm,
    },
    eventItemProgressText: {
      fontSize: FontSizes.sm,
      color: colors.primary,
      fontWeight: '600',
    },
    manualInputOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
