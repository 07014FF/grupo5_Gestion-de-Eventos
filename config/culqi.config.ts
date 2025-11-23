/**
 * Configuración de Culqi
 * Claves de sandbox para desarrollo
 */

export const CULQI_CONFIG = {
  // Claves de SANDBOX - Solo para desarrollo/universidad
  // Se obtienen desde las variables de entorno de Expo
  publicKey: process.env.EXPO_PUBLIC_CULQI_PUBLIC_KEY || 'pk_test_e94078b9b248675d',
  secretKey: process.env.EXPO_PUBLIC_CULQI_SECRET_KEY || 'sk_test_1573b0e8079863ca',
  apiUrl: process.env.EXPO_PUBLIC_CULQI_API_URL || 'https://api.culqi.com/v2',
  secureUrl: process.env.EXPO_PUBLIC_CULQI_SECURE_URL || 'https://secure.culqi.com',
  offlineMode: process.env.EXPO_PUBLIC_CULQI_OFFLINE_MODE === 'true',
};

export const isCulqiConfigured = (): boolean => {
  return Boolean(
    CULQI_CONFIG.publicKey &&
    CULQI_CONFIG.secretKey &&
    !CULQI_CONFIG.publicKey.includes('PLACEHOLDER')
  ) || CULQI_CONFIG.offlineMode;
};

export const isCulqiOfflineMode = (): boolean => CULQI_CONFIG.offlineMode === true;
