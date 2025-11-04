import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: 'es' | 'en';
}

interface AppState {
  // Settings
  settings: AppSettings;
  setTheme: (theme: AppSettings['theme']) => void;
  setNotifications: (enabled: boolean) => void;
  setLanguage: (language: AppSettings['language']) => void;

  // User Preferences
  recentSearches: string[];
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;

  // Favorites
  favoriteEvents: string[];
  toggleFavorite: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;

  // Cart (optional for ticket purchases)
  cartItems: Array<{ eventId: string; quantity: number }>;
  addToCart: (eventId: string, quantity: number) => void;
  removeFromCart: (eventId: string) => void;
  clearCart: () => void;

  // Reset all
  resetStore: () => void;
}

const initialState = {
  settings: {
    theme: 'auto' as const,
    notifications: true,
    language: 'es' as const,
  },
  recentSearches: [],
  favoriteEvents: [],
  cartItems: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Settings Actions
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      setNotifications: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, notifications: enabled },
        })),

      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),

      // Recent Searches Actions
      addRecentSearch: (search) =>
        set((state) => ({
          recentSearches: [
            search,
            ...state.recentSearches.filter((s) => s !== search),
          ].slice(0, 10), // Keep only last 10 searches
        })),

      clearRecentSearches: () =>
        set({ recentSearches: [] }),

      // Favorites Actions
      toggleFavorite: (eventId) =>
        set((state) => ({
          favoriteEvents: state.favoriteEvents.includes(eventId)
            ? state.favoriteEvents.filter((id) => id !== eventId)
            : [...state.favoriteEvents, eventId],
        })),

      isFavorite: (eventId) =>
        get().favoriteEvents.includes(eventId),

      // Cart Actions
      addToCart: (eventId, quantity) =>
        set((state) => {
          const existingItem = state.cartItems.find(
            (item) => item.eventId === eventId
          );

          if (existingItem) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.eventId === eventId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            cartItems: [...state.cartItems, { eventId, quantity }],
          };
        }),

      removeFromCart: (eventId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.eventId !== eventId),
        })),

      clearCart: () =>
        set({ cartItems: [] }),

      // Reset Actions
      resetStore: () =>
        set(initialState),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Optionally partition the store (only persist certain keys)
      partialize: (state) => ({
        settings: state.settings,
        recentSearches: state.recentSearches,
        favoriteEvents: state.favoriteEvents,
        // Don't persist cart items
      }),
    }
  )
);
