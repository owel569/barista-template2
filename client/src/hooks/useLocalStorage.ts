
import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions {
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  validator?: (value: any) => boolean;
  onError?: (error: Error) => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validator,
    onError
  } = options;

  // Fonction pour lire la valeur depuis localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const parsed = deserialize(item);
      
      // Valider la valeur si un validateur est fourni
      if (validator && !validator(parsed)) {
        console.warn(`Invalid value for localStorage key "${key}":`, parsed);
        return initialValue;
      }

      return parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
      return initialValue;
    }
  }, [key, initialValue, deserialize, validator, onError]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Fonction pour définir la valeur
  const setValue = useCallback((value: SetValue<T>) => {
    if (typeof window === 'undefined') {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      
      // Valider la nouvelle valeur
      if (validator && !validator(newValue)) {
        throw new Error(`Invalid value for localStorage key "${key}"`);
      }

      window.localStorage.setItem(key, serialize(newValue));
      setStoredValue(newValue);

      // Émettre un événement personnalisé pour synchroniser les autres composants
      window.dispatchEvent(new CustomEvent('local-storage', {
        detail: { key, newValue }
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [key, storedValue, serialize, validator, onError]);

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(new CustomEvent('local-storage', {
        detail: { key, newValue: undefined }
      }));
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [key, initialValue, onError]);

  // Écouter les changements dans le localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key !== key) return;
      
      if (e instanceof CustomEvent) {
        const { key: eventKey, newValue } = e.detail;
        if (eventKey === key) {
          setStoredValue(newValue ?? initialValue);
        }
      } else {
        setStoredValue(readValue());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [key, readValue, initialValue]);

  return [storedValue, setValue, removeValue];
}
