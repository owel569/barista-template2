// Utilitaires pour les composants UI
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types utilitaires sécurisés
export type SafeObject<T = unknown> = Record<string, T>
export type EmptyObject = Record<string, never>

// Créateur d'objet sécurisé
export function createSafeObject<T = unknown>(): SafeObject<T> {
  return Object.create(null)
}

// Validation de type pour éviter les any
export function isValidRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Hook utilitaire pour les états sécurisés
export function useSafeState<T>(initialValue: T): [T, (value: T) => void] {
  const [state, setState] = React.useState<T>(initialValue)

  const setSafeState = React.useCallback((value: T) => {
    if (value !== null && value !== undefined) {
      setState(value)
    }
  }, [])

  return [state, setSafeState]
}

// Constantes pour éviter les magic strings
export const UI_CONSTANTS = {
  DEFAULT_ANIMATION_DURATION: 200,
  DEFAULT_DEBOUNCE_DELAY: 300,
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_OVERSCAN: 5,
} as const

// Types pour les tailles standardisées
export type ComponentSize = 'sm' | 'default' | 'lg' | 'xl'
export type ComponentVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

// Interface de base pour tous les composants UI
export interface BaseUIComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

// Type helper pour les refs
export type UIComponentRef<T extends HTMLElement = HTMLElement> = React.ForwardedRef<T>

// Fonction pour merger les props de manière sécurisée
export function mergeProps<T extends Record<string, unknown>>(
  defaultProps: Partial<T>,
  userProps: Partial<T>
): T {
  return {
    ...defaultProps,
    ...userProps,
  } as T
}