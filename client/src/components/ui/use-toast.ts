
// Exports centralisés pour les toasts
export { useToast, type ToastProps, toastManager as toast, toastManager } from '@/hooks/use-toast';
export { toast as sonnerToast } from 'sonner';

// Types supplémentaires pour la compatibilité
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';
