import { useState, useEffect } from 'react';
import { LocationItem } from '../types';

export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function useHistory() {
  const [history, setHistory] = useStorage<LocationItem[]>('maps2waze_history', []);

  const addHistory = (item: Omit<LocationItem, 'id' | 'timestamp'>) => {
    const newItem: LocationItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50)); // Keep last 50
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => setHistory([]);

  return { history, addHistory, removeHistoryItem, clearHistory };
}

export function useFavorites() {
  const [favorites, setFavorites] = useStorage<LocationItem[]>('maps2waze_favorites', []);

  const addFavorite = (item: LocationItem | Omit<LocationItem, 'id' | 'timestamp'>) => {
    const fullItem: LocationItem = 'id' in item ? item : {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    if (!favorites.some(f => f.id === fullItem.id || (f.lat === fullItem.lat && f.lng === fullItem.lng && f.title === fullItem.title))) {
      setFavorites((prev) => [fullItem, ...prev]);
    }
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter(f => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
