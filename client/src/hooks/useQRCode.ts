
import React, { useState, useCallback, useMemo, useEffect } from 'react';

interface QRCodeOptions {
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
}

interface QRCodeResult {
  qrCodeUrl: string | null;
  isLoading: boolean;
  error: string | null;
  generateQR: (value: string, options?: QRCodeOptions) => Promise<void>;
}

export function useQRCode(): QRCodeResult {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async (value: string, options: QRCodeOptions = {}) => {
    if (!value) {
      setError('Valeur QR Code requise');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fallback vers une API externe si qrcode.react n'est pas disponible
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${options.size || 200}x${options.size || 200}&data=${encodeURIComponent(value)}`;
      
      // Vérifier si l'URL est accessible
      const response = await fetch(qrApiUrl, { method: 'HEAD' });
      
      if (response.ok) {
        setQrCodeUrl(qrApiUrl);
      } else {
        throw new Error('Service QR Code indisponible');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération QR Code';
      setError(errorMessage);
      setQrCodeUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Nettoyer l'URL quand le composant se démonte
  const cleanup = useCallback(() => {
    setQrCodeUrl(null);
    setError(null);
  }, []);

  return useMemo(() => ({
    qrCodeUrl,
    isLoading,
    error,
    generateQR
  }), [qrCodeUrl, isLoading, error, generateQR]);
}

// Hook pour générer des QR codes simples
export function useSimpleQR(value: string, options?: QRCodeOptions) {
  const { qrCodeUrl, isLoading, error, generateQR } = useQRCode();

  useEffect(() => {
    if (value) {
      generateQR(value, options);
    }
  }, [value, options, generateQR]);

  return { qrCodeUrl, isLoading, error };
}
