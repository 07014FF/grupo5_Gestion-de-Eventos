import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import { Ticket, TicketStatus } from '@/types/ticket.types';
import { TicketQRModal } from '@/components/TicketQRModal';
import { ErrorHandler } from '@/utils/errors';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

export default function MyTicketsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const { isDark } = useTheme();
  const palette = useThemeColors();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  const loadTickets = useCallback(async (isRefreshing = false) => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!isRefreshing) setLoading(true);
      const result = await TicketServiceSupabase.getUserTickets(user.id);

      if (result.success) {
        setTickets(result.data);
      } else {
        ErrorHandler.log(result.error, 'MyTicketsScreen.loadTickets');
        Alert.alert('Error', result.error.getUserMessage());
      }
    } catch (error) {
      ErrorHandler.log(error, 'MyTicketsScreen.loadTickets');
      const { message } = ErrorHandler.handle(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets(true);
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ticket.status === TicketStatus.ACTIVE;
    if (filter === 'used') return ticket.status === TicketStatus.USED;
    return true;
  });

  const handleTicketPress = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQrModalVisible(true);
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Open the QR modal which has the download functionality
    setSelectedTicket(ticket);
    setQrModalVisible(true);
  };

  const handleShareTicket = (ticketId: string) => {
    // TODO: Implement share functionality
    Alert.alert('Compartir Entrada', 'Esta función estará disponible próximamente.');
  };

  const renderTicketCard = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => handleTicketPress(item)}
      accessibilityLabel={`Entrada para ${item.event.title}`}
      accessibilityHint="Toca para ver el código QR de esta entrada"
      accessibilityRole="button"
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.eventTitle}>{item.event.title}</Text>
          <Text style={styles.venue}>{item.event.venue || item.event.location}</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Ionicons name="calendar-outline" size={16} color={palette.textSecondary} />
              <Text style={styles.dateTimeText}>{item.event.date}</Text>
            </View>
            <View style={styles.dateTime}>
              <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
              <Text style={styles.dateTimeText}>{item.event.time}</Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === TicketStatus.ACTIVE
                  ? palette.success
                  : palette.textSecondary,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === TicketStatus.ACTIVE ? 'Activa' : 'Usada'}
          </Text>
        </View>
      </View>

      <View style={styles.ticketDetails}>
        <View style={styles.ticketDetailItem}>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <Text style={styles.detailValue}>{item.ticketType}</Text>
        </View>
        {item.seatNumber && (
          <View style={styles.ticketDetailItem}>
            <Text style={styles.detailLabel}>Asiento:</Text>
            <Text style={styles.detailValue}>{item.seatNumber}</Text>
          </View>
        )}
        <View style={styles.ticketDetailItem}>
          <Text style={styles.detailLabel}>Precio:</Text>
          <Text style={styles.detailValue}>S/ {item.price.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.ticketActions}>
        <Button
          title="Ver QR"
          variant="primary"
          size="small"
          onPress={() => handleTicketPress(item)}
          style={styles.actionButton}
        />
        <Button
          title="Descargar"
          variant="outline"
          size="small"
          onPress={() => handleDownloadTicket(item)}
          style={styles.actionButton}
        />
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShareTicket(item.id)}
        >
          <Ionicons name="share-outline" size={20} color={palette.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Get ticket counts
  const activeCount = tickets.filter((t) => t.status === TicketStatus.ACTIVE).length;
  const usedCount = tickets.filter((t) => t.status === TicketStatus.USED).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={palette.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Entradas</Text>
        {!loading && (
          <TouchableOpacity onPress={() => loadTickets()} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={palette.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            Todas ({tickets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Activas ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'used' && styles.filterTabActive]}
          onPress={() => setFilter('used')}
        >
          <Text style={[styles.filterTabText, filter === 'used' && styles.filterTabTextActive]}>
            Usadas ({usedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
          <Text style={styles.loadingTitle}>Cargando entradas...</Text>
          <Text style={styles.loadingSubtitle}>Obteniendo tus tickets</Text>
        </View>
      ) : filteredTickets.length > 0 ? (
        /* Tickets List */
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id}
          style={styles.ticketsList}
          contentContainerStyle={[
            styles.ticketsListContent,
            { paddingBottom: Platform.OS === 'ios' ? 100 + insets.bottom : 90 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
          }
        />
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="ticket-outline" size={64} color={palette.primary} />
          </View>
          <Text style={styles.emptyTitle}>No tienes entradas</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? 'Aún no has comprado ninguna entrada para eventos.'
              : `No tienes entradas ${filter === 'active' ? 'activas' : 'usadas'}.`}
          </Text>
          <Button
            title="Explorar Eventos"
            variant="primary"
            onPress={() => console.log('Navegar a eventos')}
            style={styles.exploreButton}
          />
        </View>
      )}

      {/* QR Modal */}
      <TicketQRModal
        visible={qrModalVisible}
        ticket={selectedTicket}
        onClose={() => {
          setQrModalVisible(false);
          setSelectedTicket(null);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: typeof Colors.dark, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: palette.background,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
    },
    headerTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '700',
      color: palette.text,
    },
    refreshButton: {
      padding: Spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    loadingIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 208, 132, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    loadingTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: palette.text,
      marginBottom: Spacing.xs,
    },
    loadingSubtitle: {
      fontSize: FontSizes.md,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: palette.backgroundSecondary,
    },
    filterTab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      marginHorizontal: Spacing.xs,
    },
    filterTabActive: {
      backgroundColor: palette.primary,
    },
    filterTabText: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    filterTabTextActive: {
      color: palette.textLight,
    },
    ticketsList: {
      flex: 1,
    },
    ticketsListContent: {
      padding: Spacing.lg,
      paddingTop: Spacing.md,
    },
    ticketCard: {
      backgroundColor: palette.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(0, 208, 132, 0.2)',
      ...Shadows.md,
      shadowColor: palette.primary,
      shadowOpacity: 0.1,
      elevation: 4,
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    ticketInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: palette.text,
      marginBottom: Spacing.xs,
    },
    venue: {
      fontSize: FontSizes.md,
      color: palette.textSecondary,
      marginBottom: Spacing.sm,
    },
    dateTimeContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    dateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs / 2,
    },
    dateTimeText: {
      fontSize: FontSizes.sm,
      color: palette.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.sm,
    },
    statusText: {
      fontSize: FontSizes.xs,
      fontWeight: '600',
      color: palette.textLight,
    },
    ticketDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
    },
    ticketDetailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: FontSizes.xs,
      color: palette.textSecondary,
      marginBottom: Spacing.xs / 2,
    },
    detailValue: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.text,
    },
    ticketActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
    },
    actionButton: {
      flex: 1,
    },
    shareButton: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxxl * 2,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 208, 132, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: palette.text,
      marginBottom: Spacing.sm,
    },
    emptySubtitle: {
      fontSize: FontSizes.md,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.xl,
      maxWidth: 300,
    },
    exploreButton: {
      paddingHorizontal: Spacing.xl,
    },
  });
