import { Toaster as SonnerToaster } from 'sonner';
import React from 'react';

export function Toaster(): JSX.Element {
  return (
    <SonnerToaster 
      position="top-right" 
      richColors 
      closeButton 
    />
  )
}