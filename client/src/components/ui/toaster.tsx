import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(): JSX.Element {
  return (
    <SonnerToaster 
      position="top-right"
      expand={true}
      richColors
      closeButton
      theme="light"
    />
  );
}