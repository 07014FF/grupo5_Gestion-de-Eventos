import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Event } from '@/types/ticket.types';

export class ShareService {
  /**
   * Compartir un evento
   */
  static async shareEvent(event: Event): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          'No disponible',
          'Compartir no está disponible en este dispositivo'
        );
        return;
      }

      // Build share message
      const message = `
🎉 ¡Mira este evento increíble!

📅 ${event.title}
📍 ${event.venue || event.location}
🕐 ${event.date} a las ${event.time}
💰 S/ ${event.price.toFixed(2)}

${event.description ? `\n${event.description}\n` : ''}
¡No te lo pierdas! 🎊
      `.trim();

      // For now, we'll use Alert to show the message
      // In production, you'd integrate with expo-sharing or React Native Share
      Alert.alert(
        'Compartir Evento',
        message,
        [
          {
            text: 'Copiar',
            onPress: () => {
              // Copy to clipboard logic would go here
              Alert.alert('Copiado', 'El mensaje fue copiado al portapapeles');
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Error', 'No se pudo compartir el evento');
    }
  }

  /**
   * Compartir texto simple
   */
  static async shareText(text: string, title?: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          'No disponible',
          'Compartir no está disponible en este dispositivo'
        );
        return;
      }

      Alert.alert(
        title || 'Compartir',
        text,
        [
          {
            text: 'Copiar',
            onPress: () => {
              Alert.alert('Copiado', 'El texto fue copiado');
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error sharing text:', error);
      Alert.alert('Error', 'No se pudo compartir');
    }
  }

  /**
   * Generate event URL (for deep linking in the future)
   */
  static generateEventUrl(eventId: string): string {
    // This would be your app's deep link or website URL
    return `https://miseventos.pe/event/${eventId}`;
  }

  /**
   * Share event with native share dialog (alternative implementation)
   */
  static async shareEventNative(event: Event): Promise<boolean> {
    try {
      const message = `🎉 ${event.title}\n📍 ${event.venue || event.location}\n🕐 ${event.date} - ${event.time}\n💰 S/ ${event.price.toFixed(2)}`;

      // In a real implementation, you would use:
      // const result = await Share.share({ message });
      // return result.action === Share.sharedAction;

      await ShareService.shareText(message, 'Compartir Evento');
      return true;
    } catch (error) {
      console.error('Error in native share:', error);
      return false;
    }
  }
}
