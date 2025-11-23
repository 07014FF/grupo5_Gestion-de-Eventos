import FormContainer from '@/components/FormContainer';
import { Button, ControlledInput } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

// Constants
const DEFAULT_CATEGORY = 'General';

// Validation Schema
const eventSchema = z.object({
  title: z.string()
    .min(1, 'El título del evento es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  date: z.string()
    .min(1, 'La fecha del evento es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD (Ej: 2024-12-31)')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return date instanceof Date && !isNaN(date.getTime());
    }, 'La fecha no es válida'),
  time: z.string()
    .min(1, 'La hora del evento es requerida')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'La hora debe tener el formato HH:MM (Ej: 19:00)'),
  location: z.string()
    .min(1, 'La ubicación es requerida')
    .min(2, 'La ubicación debe tener al menos 2 caracteres'),
  venue: z.string().optional(),
  category: z.string().optional(),
  price: z.string()
    .min(1, 'El precio es requerido')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'El precio debe ser un número válido mayor o igual a 0'),
  totalTickets: z.string()
    .min(1, 'La cantidad de tickets es requerida')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1;
    }, 'La cantidad de tickets debe ser mayor a 0'),
  imageUrl: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form with validation
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      date: '',
      time: '',
      location: '',
      venue: '',
      category: '',
      price: '',
      totalTickets: '',
      imageUrl: '',
    },
  });

  const prepareEventData = (data: EventFormData) => {
    const price = parseFloat(data.price);
    const totalTickets = parseInt(data.totalTickets);

    return {
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || null,
      description: data.description?.trim() || null,
      date: data.date.trim(),
      time: data.time.trim(),
      location: data.location.trim(),
      venue: data.venue?.trim() || null,
      price,
      total_tickets: totalTickets,
      available_tickets: totalTickets,
      category: data.category?.trim() || DEFAULT_CATEGORY,
      image_url: data.imageUrl?.trim() || null,
      status: 'active',
    };
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear eventos.');
      return;
    }

    try {
      setLoading(true);

      const eventData = prepareEventData(data);
      const { error } = await supabase
        .from('events')
        .insert(eventData)
        .select();

      if (error) throw error;

      Alert.alert(
        'Éxito',
        'El evento ha sido creado correctamente',
        [{
          text: 'OK',
          onPress: () => {
            reset();
            router.back();
          },
        }]
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el evento. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="flash-outline" size={16} color={Colors.dark.textLight} />
          <Text style={styles.badgeText}>Panel de administración</Text>
        </View>
        <Text style={styles.title}>Crear Nuevo Evento</Text>
        <Text style={styles.subtitle}>
          Completa la información del evento y publícalo cuando estés listo.
        </Text>
      </View>

      <View style={styles.helperStrip}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.dark.primary} />
        <Text style={styles.helperStripText}>
          Los cambios se guardan como borrador hasta confirmar la creación.
        </Text>
      </View>

      <View style={styles.progressSteps}>
        {[
          { key: 'info', label: 'Información', icon: 'document-text-outline' },
          { key: 'agenda', label: 'Agenda', icon: 'calendar-outline' },
          { key: 'tickets', label: 'Tickets', icon: 'pricetags-outline' },
        ].map((step, index) => (
          <View
            key={step.key}
            style={[
              styles.stepItem,
              index === 0 && styles.stepItemActive,
            ]}
          >
            <View style={[
              styles.stepIcon,
              index === 0 && styles.stepIconActive,
            ]}>
              <Ionicons
                name={step.icon as any}
                size={18}
                color={index === 0 ? Colors.dark.background : Colors.dark.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                index === 0 && styles.stepLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.formSections}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información general</Text>
            <Text style={styles.sectionDescription}>
              Define título, descripción y categoría para ayudar a destacarlo.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <ControlledInput
              control={control}
              name="title"
              label="Título del Evento *"
              placeholder="Ej: Festival de Jazz 2024"
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <ControlledInput
              control={control}
              name="subtitle"
              label="Subtítulo"
              placeholder="Ej: Una noche de música en vivo"
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <ControlledInput
              control={control}
              name="description"
              label="Descripción"
              placeholder="Describe el evento..."
              multiline
              numberOfLines={4}
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <ControlledInput
              control={control}
              name="category"
              label="Categoría"
              placeholder="Ej: Música, Teatro, Deportes"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda y ubicación</Text>
            <Text style={styles.sectionDescription}>
              Indica fecha, hora y lugar para sincronizarlo con la app.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.inlineGroup}>
              <View style={styles.inlineField}>
                <ControlledInput
                  control={control}
                  name="date"
                  label="Fecha *"
                  placeholder="YYYY-MM-DD (Ej: 2024-12-31)"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inlineField}>
                <ControlledInput
                  control={control}
                  name="time"
                  label="Hora *"
                  placeholder="HH:MM (Ej: 19:00)"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <ControlledInput
              control={control}
              name="location"
              label="Ciudad *"
              placeholder="Ej: Lima"
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <ControlledInput
              control={control}
              name="venue"
              label="Lugar/Venue"
              placeholder="Ej: Teatro Colón"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets y assets</Text>
            <Text style={styles.sectionDescription}>
              Configura precios, cupos y material gráfico antes de publicar.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.inlineGroup}>
              <View style={styles.inlineField}>
                <ControlledInput
                  control={control}
                  name="price"
                  label="Precio (S/) *"
                  placeholder="Ej: 50.00"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inlineField}>
                <ControlledInput
                  control={control}
                  name="totalTickets"
                  label="Total de Entradas *"
                  placeholder="Ej: 500"
                  keyboardType="numeric"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <ControlledInput
              control={control}
              name="imageUrl"
              label="URL de Imagen"
              placeholder="https://ejemplo.com/imagen.jpg"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />

            <Text style={styles.helperText}>
              * Campos requeridos
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.helperCard}>
        <Ionicons name="sparkles-outline" size={20} color={Colors.dark.primary} />
        <View style={styles.helperCardContent}>
          <Text style={styles.helperCardTitle}>Consejo rápido</Text>
          <Text style={styles.helperCardText}>
            Define un cupo realista para evitar sobreventa y agrega una imagen en alta calidad.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={() => router.back()}
          disabled={loading}
        />

        <Button
          title={loading ? 'Creando...' : 'Crear Evento'}
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        />
      </View>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    backgroundColor: Colors.dark.background,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.lg,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
  },
  badgeText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  helperStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  helperStripText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
  },
  progressSteps: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepItemActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  stepLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: Colors.dark.text,
  },
  formSections: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  helperText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  inlineGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  inlineField: {
    flex: 1,
    minWidth: '45%',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  helperCardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  helperCardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  helperCardText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
});
