
import { useToast } from '@/hooks/use-toast';

export interface TypedToastConfig {
  title: string;
  description?: string;
  duration?: number;
}

export function useTypedToast() {
  const { toast } = useToast();
  
  return {
    success: (config: TypedToastConfig) => 
      toast({
        title: config.title,
        description: config.description,
        variant: 'default',
        duration: config.duration,
        className: 'bg-green-50 border-green-200 text-green-800'
      }),
    
    error: (config: TypedToastConfig) => 
      toast({
        title: config.title,
        description: config.description,
        variant: 'destructive',
        duration: config.duration
      }),
    
    info: (config: TypedToastConfig) => 
      toast({
        title: config.title,
        description: config.description,
        variant: 'default',
        duration: config.duration
      })
  };
}
