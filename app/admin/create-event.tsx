import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button, Input } from '@/components/ui';

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    price: '',
    totalTickets: '',
    category: '',
    imageUrl: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título del evento es requerido');
      return false;
    }

    if (!formData.date.trim()) {
      Alert.alert('Error', 'La fecha del evento es requerida');
      return false;
    }

    if (!formData.time.trim()) {
      Alert.alert('Error', 'La hora del evento es requerida');
      return false;
    }

    if (!formData.location.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return false;
    }

    const totalTickets = parseInt(formData.totalTickets);
    if (isNaN(totalTickets) || totalTickets < 1) {
      Alert.alert('Error', 'La cantidad de tickets debe ser mayor a 0');
      return false;
    }

    return true;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const price = parseFloat(formData.price);
      const totalTickets = parseInt(formData.totalTickets);

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim() || null,
          description: formData.description.trim() || null,
          date: formData.date.trim(),
          time: formData.time.trim(),
          location: formData.location.trim(),
          venue: formData.venue.trim() || null,
          price,
          total_tickets: totalTickets,
          available_tickets: totalTickets,
          category: formData.category.trim() || 'General',
          image_url: formData.imageUrl.trim() || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert(
        'Éxito',
        'El evento ha sido creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo crear el evento. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear Nuevo Evento</Text>
          <Text style={styles.subtitle}>
            Completa la información del evento
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Título del Evento *"
            placeholder="Ej: Festival de Jazz 2024"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
          />

          <Input
            label="Subtítulo"
            placeholder="Ej: Una noche de música en vivo"
            value={formData.subtitle}
            onChangeText={(value) => handleInputChange('subtitle', value)}
          />

          <Input
            label="Descripción"
            placeholder="Describe el evento..."
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={4}
          />

          <Input
            label="Fecha *"
            placeholder="YYYY-MM-DD (Ej: 2024-12-31)"
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
          />

          <Input
            label="Hora *"
            placeholder="HH:MM (Ej: 19:00)"
            value={formData.time}
            onChangeText={(value) => handleInputChange('time', value)}
          />

          <Input
            label="Ciudad *"
            placeholder="Ej: Bogotá"
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
          />

          <Input
            label="Lugar/Venue"
            placeholder="Ej: Teatro Colón"
            value={formData.venue}
            onChangeText={(value) => handleInputChange('venue', value)}
          />

          <Input
            label="Categoría"
            placeholder="Ej: Música, Teatro, Deportes"
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
          />

          <Input
            label="Precio (COP) *"
            placeholder="Ej: 45000"
            value={formData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            keyboardType="numeric"
          />

          <Input
            label="Total de Entradas *"
            placeholder="Ej: 500"
            value={formData.totalTickets}
            onChangeText={(value) => handleInputChange('totalTickets', value)}
            keyboardType="numeric"
          />

          <Input
            label="URL de Imagen"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={formData.imageUrl}
            onChangeText={(value) => handleInputChange('imageUrl', value)}
            autoCapitalize="none"
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
            onPress={handleCreateEvent}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  helperText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
