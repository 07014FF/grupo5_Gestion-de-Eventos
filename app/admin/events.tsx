/**
 * Event Management Screen
 * Admin (Organizador): Ver y editar sus eventos, marcar como finalizado (NO eliminar)
 * Super Admin: CRUD completo (incluyendo eliminar)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';

interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  status: string;
  availableTickets: number;
  totalTickets: number;
  createdBy: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: '🟢 Activo',
  finished: '🔴 Finalizado',
  cancelled: '⚫ Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ECDC4',
  finished: '#95A5A6',
  cancelled: '#E74C3C',
};

export default function EventManagementScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta sección');
      router.back();
    }
  }, [isAdmin]);

  const loadEvents = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      // Admin solo ve sus eventos, super_admin ve todos
      if (!isSuperAdmin) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedEvents: EventItem[] =
        data?.map((e) => ({
          id: e.id,
          title: e.title,
          subtitle: e.subtitle || '',
          date: e.date,
          location: e.location,
          status: e.status,
          availableTickets: e.available_tickets || 0,
          totalTickets: e.total_tickets || 0,
          createdBy: e.created_by,
        })) || [];

      setEvents(mappedEvents);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los eventos');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleChangeStatus = async (eventId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      Alert.alert('Éxito', 'Estado del evento actualizado correctamente');
      setShowStatusModal(false);
      loadEvents();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del evento');
      console.error(error);
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (!isSuperAdmin) {
      Alert.alert(
        'Acceso Denegado',
        'Solo los super administradores pueden eliminar eventos. Como organizador, puedes marcar el evento como finalizado.'
      );
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar "${eventTitle}"? Esta acción no se puede deshacer y eliminará todas las compras y tickets asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('events').delete().eq('id', eventId);

              if (error) throw error;

              Alert.alert('Éxito', 'Evento eliminado correctamente');
              loadEvents();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el evento');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const isOwnEvent = item.createdBy === user?.id;
    const canDelete = isSuperAdmin; // Solo super_admin puede eliminar
    const canEdit = isOwnEvent || isSuperAdmin; // Puede editar si es su evento o es super_admin

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventSubtitle}>{item.subtitle}</Text>
            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString('es-PE')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: STATUS_COLORS[item.status] + '20',
                  borderColor: STATUS_COLORS[item.status],
                },
              ]}
            >
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>

          <View style={styles.ticketInfo}>
            <Text style={styles.ticketCount}>{item.availableTickets}</Text>
            <Text style={styles.ticketLabel}>de {item.totalTickets}</Text>
            <Text style={styles.ticketSubLabel}>disponibles</Text>
          </View>
        </View>

        <View style={styles.eventActions}>
          {canEdit && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                setSelectedEvent(item);
                setShowStatusModal(true);
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Cambiar Estado</Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtnStyle]}
              onPress={() => handleDeleteEvent(item.id, item.title)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>Eliminar</Text>
            </TouchableOpacity>
          )}

          {!isOwnEvent && (
            <View style={styles.notOwnedBadge}>
              <Text style={styles.notOwnedText}>📋 No es tu evento</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSuperAdmin ? '👑 Gestión de Eventos' : '👨‍💼 Mis Eventos'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{events.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{events.filter((e) => e.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {events.filter((e) => e.status === 'finished').length}
          </Text>
          <Text style={styles.statLabel}>Finalizados</Text>
        </View>
      </View>

      {/* Info Badge */}
      <View style={styles.infoBadge}>
        <Ionicons
          name={isSuperAdmin ? 'shield-checkmark' : 'information-circle'}
          size={16}
          color={isSuperAdmin ? '#9B59B6' : colors.primary}
        />
        <Text style={styles.infoBadgeText}>
          {isSuperAdmin
            ? 'Como Super Admin puedes editar y eliminar cualquier evento'
            : 'Como Organizador puedes editar tus eventos y marcarlos como finalizados (no eliminar)'}
        </Text>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {isSuperAdmin ? 'No hay eventos registrados' : 'No has creado ningún evento aún'}
            </Text>
          </View>
        }
      />

      {/* Status Change Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Estado del Evento</Text>
            <Text style={styles.modalSubtitle}>{selectedEvent?.title}</Text>

            <View style={styles.statusOptions}>
              {Object.entries(STATUS_LABELS).map(([statusKey, statusLabel]) => {
                // Admin no puede cambiar a cancelled, solo super_admin
                if (statusKey === 'cancelled' && !isSuperAdmin) {
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={statusKey}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: STATUS_COLORS[statusKey] + '15',
                        borderColor:
                          selectedEvent?.status === statusKey
                            ? STATUS_COLORS[statusKey]
                            : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      if (selectedEvent) {
                        handleChangeStatus(selectedEvent.id, statusKey);
                      }
                    }}
                  >
                    <Text style={[styles.statusOptionText, { color: STATUS_COLORS[statusKey] }]}>
                      {statusLabel}
                    </Text>
                    {selectedEvent?.status === statusKey && (
                      <Ionicons name="checkmark-circle" size={20} color={STATUS_COLORS[statusKey]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoBadgeText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  eventMeta: {
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  ticketLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ticketSubLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteBtnStyle: {
    backgroundColor: '#FF6B6B15',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  notOwnedBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  notOwnedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  statusOptions: {
    gap: 12,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
