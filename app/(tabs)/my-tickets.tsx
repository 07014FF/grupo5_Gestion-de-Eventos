import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import { Ticket, TicketStatus } from '@/types/ticket.types';
import { TicketQRModal } from '@/components/TicketQRModal';
import { ErrorHandler } from '@/utils/errors';

export default function MyTicketsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
    }
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
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.eventTitle}>{item.event.title}</Text>
          <Text style={styles.venue}>{item.event.venue || item.event.location}</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Ionicons name="calendar-outline" size={16} color={Colors.dark.textSecondary} />
              <Text style={styles.dateTimeText}>{item.event.date}</Text>
            </View>
            <View style={styles.dateTime}>
              <Ionicons name="time-outline" size={16} color={Colors.dark.textSecondary} />
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
                  ? Colors.dark.success
                  : Colors.dark.textSecondary,
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
          <Text style={styles.detailValue}>${item.price.toLocaleString()}</Text>
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
          <Ionicons name="share-outline" size={20} color={Colors.dark.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Get ticket counts
  const activeCount = tickets.filter((t) => t.status === TicketStatus.ACTIVE).length;
  const usedCount = tickets.filter((t) => t.status === TicketStatus.USED).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.dark.background} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Entradas</Text>
        {!loading && (
          <TouchableOpacity onPress={loadTickets} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={Colors.dark.primary} />
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
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Cargando entradas...</Text>
        </View>
      ) : filteredTickets.length > 0 ? (
        /* Tickets List */
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id}
          style={styles.ticketsList}
          contentContainerStyle={styles.ticketsListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color={Colors.dark.textSecondary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },
  filterTabActive: {
    backgroundColor: Colors.dark.primary,
  },
  filterTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.dark.textLight,
  },
  ticketsList: {
    flex: 1,
  },
  ticketsListContent: {
    padding: Spacing.lg,
  },
  ticketCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.sm,
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
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  venue: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
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
    color: Colors.dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.dark.textLight,
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.text,
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    paddingHorizontal: Spacing.xl,
  },
});