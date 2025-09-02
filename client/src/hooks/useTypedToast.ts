import { useToast } from './use-toast';

export const useTypedToast = () => {
  const { toast } = useToast();

  const success = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  };

  const error = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const info = (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  };

  return {
    success,
    error,
    info,
    toast,
  };
}