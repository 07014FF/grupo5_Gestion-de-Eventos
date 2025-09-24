import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

// Datos de ejemplo para entradas del usuario
const MY_TICKETS = [
  {
    id: '1',
    eventTitle: 'Festival de Jazz 2024',
    venue: 'Centro Cultural',
    date: '2024-03-15',
    time: '20:00',
    ticketType: 'General',
    qrCode: 'QR_001_JAZZ_2024',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    seatNumber: 'A-15',
    price: '$45.000',
  },
  {
    id: '2',
    eventTitle: 'Obra: Romeo y Julieta',
    venue: 'Teatro Municipal',
    date: '2024-03-20',
    time: '19:30',
    ticketType: 'General',
    qrCode: 'QR_002_ROMEO_2024',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400',
    seatNumber: 'B-22',
    price: '$35.000',
  },
  {
    id: '3',
    eventTitle: 'Concierto Sinfónico',
    venue: 'Auditorio Nacional',
    date: '2024-02-10',
    time: '21:00',
    ticketType: 'Premium',
    qrCode: 'QR_003_SINF_2024',
    status: 'used',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    seatNumber: 'C-8',
    price: '$60.000',
  },
];

export default function MyTicketsScreen() {
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  const filteredTickets = MY_TICKETS.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const handleTicketPress = (ticketId: string) => {
    console.log('Entrada seleccionada:', ticketId);
  };

  const handleDownloadTicket = (ticketId: string) => {
    console.log('Descargar entrada:', ticketId);
  };

  const handleShareTicket = (ticketId: string) => {
    console.log('Compartir entrada:', ticketId);
  };

  const renderTicketCard = ({ item }: { item: typeof MY_TICKETS[0] }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => handleTicketPress(item.id)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.eventTitle}>{item.eventTitle}</Text>
          <Text style={styles.venue}>{item.venue}</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.dateTimeText}>{item.date}</Text>
            </View>
            <View style={styles.dateTime}>
              <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.dateTimeText}>{item.time}</Text>
            </View>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? Colors.light.success : Colors.light.textSecondary }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Activa' : 'Usada'}
          </Text>
        </View>
      </View>

      <View style={styles.ticketDetails}>
        <View style={styles.ticketDetailItem}>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <Text style={styles.detailValue}>{item.ticketType}</Text>
        </View>
        <View style={styles.ticketDetailItem}>
          <Text style={styles.detailLabel}>Asiento:</Text>
          <Text style={styles.detailValue}>{item.seatNumber}</Text>
        </View>
        <View style={styles.ticketDetailItem}>
          <Text style={styles.detailLabel}>Precio:</Text>
          <Text style={styles.detailValue}>{item.price}</Text>
        </View>
      </View>

      <View style={styles.ticketActions}>
        <Button
          title="Ver QR"
          variant="primary"
          size="small"
          onPress={() => handleTicketPress(item.id)}
          style={styles.actionButton}
        />
        <Button
          title="Descargar"
          variant="outline"
          size="small"
          onPress={() => handleDownloadTicket(item.id)}
          style={styles.actionButton}
        />
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShareTicket(item.id)}
        >
          <Ionicons name="share-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Entradas</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            Todas ({MY_TICKETS.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Activas ({MY_TICKETS.filter(t => t.status === 'active').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'used' && styles.filterTabActive]}
          onPress={() => setFilter('used')}
        >
          <Text style={[styles.filterTabText, filter === 'used' && styles.filterTabTextActive]}>
            Usadas ({MY_TICKETS.filter(t => t.status === 'used').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      {filteredTickets.length > 0 ? (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id}
          style={styles.ticketsList}
          contentContainerStyle={styles.ticketsListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color={Colors.light.textSecondary} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.light.textLight,
  },
  ticketsList: {
    flex: 1,
  },
  ticketsListContent: {
    padding: Spacing.lg,
  },
  ticketCard: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  venue: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  ticketDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
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
    borderColor: Colors.light.border,
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
    color: Colors.light.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    paddingHorizontal: Spacing.xl,
  },
});