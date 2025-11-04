import FormContainer from '@/components/FormContainer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button, ControlledInput } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

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
        <Text style={styles.title}>Crear Nuevo Evento</Text>
        <Text style={styles.subtitle}>
          Completa la información del evento
        </Text>
      </View>

      <View style={styles.form}>
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
          name="date"
          label="Fecha *"
          placeholder="YYYY-MM-DD (Ej: 2024-12-31)"
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <ControlledInput
          control={control}
          name="time"
          label="Hora *"
          placeholder="HH:MM (Ej: 19:00)"
          returnKeyType="next"
          blurOnSubmit={false}
        />

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

        <ControlledInput
          control={control}
          name="category"
          label="Categoría"
          placeholder="Ej: Música, Teatro, Deportes"
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <ControlledInput
          control={control}
          name="price"
          label="Precio (S/) *"
          placeholder="Ej: 50.00"
          keyboardType="decimal-pad"
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <ControlledInput
          control={control}
          name="totalTickets"
          label="Total de Entradas *"
          placeholder="Ej: 500"
          keyboardType="numeric"
          returnKeyType="next"
          blurOnSubmit={false}
        />

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
    paddingBottom: Spacing.xs,
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
  form: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  helperText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
