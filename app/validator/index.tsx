/**
 * Pantalla principal del Validador de Entradas
 * Incluye QR Scanner, validación manual, y estadísticas en tiempo real
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
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Evento</Text>
              <TouchableOpacity onPress={() => setShowEventSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingEvents ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.eventItem,
                      selectedEvent?.id === item.id && styles.eventItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedEvent(item);
                      setShowEventSelector(false);
                    }}
                  >
                    <View style={styles.eventItemHeader}>
                      <Text style={styles.eventItemTitle}>{item.title}</Text>
                      {selectedEvent?.id === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.eventItemMeta}>
                      <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                      <Text style={styles.eventItemMetaText}>
                        {new Date(item.date).toLocaleDateString('es-PE')}
                      </Text>
                    </View>
                    <View style={styles.eventItemMeta}>
                      <Ionicons name="location" size={14} color={colors.textSecondary} />
                      <Text style={styles.eventItemMetaText}>{item.location}</Text>
                    </View>
                    <View style={styles.eventItemProgress}>
                      <Text style={styles.eventItemProgressText}>
                        {item.validatedCount} / {item.capacity} validados
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.eventList}
              />
            )}
          </View>
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
    ]
  );

  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    // Muestra una pantalla vacía o un spinner mientras se redirige
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 100 }} size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎫 Centro de Validación</Text>
          {selectedEvent && (
            <TouchableOpacity
              style={styles.eventSelector}
              onPress={() => setShowEventSelector(true)}
            >
              <Text style={styles.eventSelectorText} numberOfLines={1}>
                {selectedEvent.title}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          {/* Indicador de sincronización */}
          {pendingValidations > 0 && (
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Ionicons name="cloud-upload" size={20} color={colors.white} />
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{pendingValidations}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Botón de cerrar sesión */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {!selectedEvent ? (
          <View style={styles.noEventContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.noEventText}>Selecciona un evento para comenzar</Text>
            <TouchableOpacity
              style={styles.selectEventButton}
              onPress={() => setShowEventSelector(true)}
            >
              <Text style={styles.selectEventButtonText}>Seleccionar Evento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hubContainer}>
            {/* Estadísticas */}
            <ValidatorStats
              stats={stats}
              isLoading={isLoadingStats}
              onRefresh={loadStats}
            />

            {/* Acciones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.mainActionButton}
                onPress={() => setViewMode('scanner')} // Esto abrirá el scanner
              >
                <Ionicons name="qr-code" size={32} color={colors.white} />
                <Text style={styles.mainActionButtonText}>Escanear QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setViewMode('manual')} // Esto abrirá el input manual
              >
                <Text style={styles.secondaryActionButtonText}>Ingresar código manualmente</Text>
              </TouchableOpacity>
            </View>
            
            {/* Actividad Reciente */}
            <View style={styles.recentActivityContainer}>
              <Text style={styles.recentActivityTitle}>Actividad Reciente</Text>
              {recentValidations.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>Las validaciones aparecerán aquí.</Text>
                </View>
              ) : (
                <FlatList
                  data={recentValidations}
                  keyExtractor={(item, index) => `${item.validatedAt}-${index}`}
                  renderItem={({ item }) => <RecentValidationItem item={item} colors={colors} />}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Modal para el Scanner */}
      <Modal
        visible={viewMode === 'scanner'}
        animationType="slide"
        onRequestClose={() => setViewMode('stats')}
      >
        <QRScanner onScan={handleValidateTicket} isProcessing={isProcessing} onCancel={() => setViewMode('stats')} />
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

// Componente para item de la lista de actividad reciente
const RecentValidationItem = ({ item, colors }: { item: TicketValidation, colors: any }) => {
  // Como el servicio por ahora solo devuelve validos, lo forzamos.
  // En una futura iteración, esto sería dinámico.
  const icon = item.status === 'valid' ? 'checkmark-circle' : 'close-circle';
  const iconColor = item.status === 'valid' ? colors.success : colors.error;
  const time = new Date(item.validatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={itemStyles(colors).container}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <View style={itemStyles(colors).info}>
        <Text style={itemStyles(colors).userName} numberOfLines={1}>
          {item.userName}
        </Text>
        <Text style={itemStyles(colors).ticketType}>
          Entrada {item.ticketType}
        </Text>
      </View>
      <Text style={itemStyles(colors).time}>{time}</Text>
    </View>
  );
};

// Estilos para RecentValidationItem
const itemStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
    },
    info: {
        flex: 1,
        marginHorizontal: Spacing.md,
    },
    userName: {
        color: colors.text,
        fontWeight: '600',
        fontSize: FontSizes.sm,
    },
    ticketType: {
        color: colors.textSecondary,
        fontSize: FontSizes.xs,
        textTransform: 'capitalize',
    },
    time: {
        color: colors.textSecondary,
        fontSize: FontSizes.xs,
        fontWeight: '500',
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
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: Spacing.md,
    },
    backButton: {
      padding: Spacing.xs,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '700',
      color: colors.text,
    },
    eventSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.xs,
    },
    eventSelectorText: {
      fontSize: FontSizes.sm,
      color: colors.primary,
      fontWeight: '500',
      maxWidth: 200,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    syncButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    logoutButton: {
      width: 44,
      height: 44,
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
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncBadgeText: {
      fontSize: FontSizes.xs,
      color: colors.white,
      fontWeight: '700',
    },
    content: {
      flex: 1,
    },
    hubContainer: {
      flex: 1,
      padding: Spacing.lg,
    },
    actionsContainer: {
      marginVertical: Spacing.lg,
      alignItems: 'center',
    },
    mainActionButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    mainActionButtonText: {
      color: colors.white,
      fontSize: FontSizes.lg,
      fontWeight: '700',
      marginLeft: Spacing.md,
    },
    secondaryActionButton: {
      marginTop: Spacing.lg,
    },
    secondaryActionButtonText: {
      color: colors.primary,
      fontSize: FontSizes.md,
      fontWeight: '600',
    },
    recentActivityContainer: {
      flex: 1,
      marginTop: Spacing.lg,
    },
    recentActivityTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
    },
    emptyStateText: {
      marginTop: Spacing.md,
      color: colors.textSecondary,
      fontSize: FontSizes.sm,
    },
    noEventContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    noEventText: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      textAlign: 'center',
    },
    selectEventButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    selectEventButtonText: {
      color: colors.white,
      fontSize: FontSizes.md,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '80%',
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '700',
      color: colors.text,
    },
    eventList: {
      padding: Spacing.lg,
    },
    eventItem: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    eventItemSelected: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(0, 208, 132, 0.1)',
    },
    eventItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    eventItemTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    eventItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    eventItemMetaText: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
    },
    eventItemProgress: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    eventItemProgressText: {
      fontSize: FontSizes.sm,
      color: colors.primary,
      fontWeight: '600',
    },
    manualInputOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    }
  });
