import { toast as hotToast } from 'react-hot-toast';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export interface UseToastReturn {
  toast: (props: ToastProps | string) => void;
}

export const useToast = (): UseToastReturn => {
  const toast = (props: ToastProps | string) => {
    if (typeof props === 'string') {
      hotToast(props);
    } else {
      const { title, description, variant = 'default' } = props;
      const message = title && description ? `${title}: ${description}` : title || description || '';

      switch (variant) {
        case 'success':
          hotToast.success(message);
          break;
        case 'destructive':
          hotToast.error(message);
          break;
        default:
          hotToast(message);
      }
    }
  };

  return { toast };
};