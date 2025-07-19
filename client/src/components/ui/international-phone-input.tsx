import React, { useState, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Pays les plus courants pour Barista Café (Maroc + touristes fréquents)
const countries = [
  { code: 'MA', flag: '🇲🇦', name: 'Maroc', dialCode: '+212', pattern: '[0-9]{9}', placeholder: '612345678' },
  { code: 'FR', flag: '🇫🇷', name: 'France', dialCode: '+33', pattern: '[0-9]{9}', placeholder: '612345678' },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne', dialCode: '+34', pattern: '[0-9]{9}', placeholder: '612345678' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique', dialCode: '+32', pattern: '[0-9]{8,9}', placeholder: '12345678' },
  { code: 'US', flag: '🇺🇸', name: 'États-Unis', dialCode: '+1', pattern: '[0-9]{10}', placeholder: '2025551234' },
  { code: 'GB', flag: '🇬🇧', name: 'Royaume-Uni', dialCode: '+44', pattern: '[0-9]{10}', placeholder: '7123456789' },
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne', dialCode: '+49', pattern: '[0-9]{10,11}', placeholder: '1234567890' },
  { code: 'IT', flag: '🇮🇹', name: 'Italie', dialCode: '+39', pattern: '[0-9]{8,10}', placeholder: '3123456789' },
];

interface InternationalPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const InternationalPhoneInput = forwardRef<HTMLInputElement, InternationalPhoneInputProps>(
  ({ value = '', onChange, placeholder, className, disabled, ...props }, ref) => {
    // Extraire le code pays et le numéro du value actuel
    const getCountryFromValue = (phoneValue: string) => {
      if (!phoneValue) return countries[0]; // Maroc par défaut

      const country = countries.find(c => phoneValue.startsWith(c.dialCode));
      return country || countries[0];
    };

    const getPhoneNumberFromValue = (phoneValue: string, country: any) => {
      if (!phoneValue) return '';
      return phoneValue.startsWith(country.dialCode) 
        ? phoneValue.slice(country.dialCode.length)
        : phoneValue;
    };

    const [selectedCountry, setSelectedCountry] = useState(() => getCountryFromValue(value));
    const [phoneNumber, setPhoneNumber] = useState(() => getPhoneNumberFromValue(value, getCountryFromValue(value)));

    const handleCountryChange = (countryCode: string) => {
      const country = countries.find(c => c.code === countryCode) || countries[0];
      setSelectedCountry(country);

      // Reformater le numéro avec le nouveau code pays
      const fullNumber = phoneNumber ? `${country.dialCode}${phoneNumber}` : country.dialCode;
      onChange?.(fullNumber);
    };

    const handlePhoneNumberChange = (number: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleanNumber = number.replace(/[^0-9]/g, '');
      setPhoneNumber(cleanNumber);

      // Créer le numéro complet avec indicatif
      const fullNumber = cleanNumber ? `${selectedCountry.dialCode}${cleanNumber}` : selectedCountry.dialCode;
      onChange?.(fullNumber);
    };

    const formatDisplayNumber = (number: string) => {
      if (!number) return '';

      // Format simple pour l'affichage (ajouter des espaces)
      switch (selectedCountry.code) {
        case 'MA':
        case 'FR':
          return number.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        case 'US':
          return number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        default:
          return number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      }
    };

    return (
      <div className={cn("flex gap-2", className)}>
        <Select value={selectedCountry.code} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground">{country.dialCode}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneNumberChange(e.target.value)}
          placeholder={placeholder || selectedCountry.placeholder}
          className="flex-1"
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

InternationalPhoneInput.displayName = 'InternationalPhoneInput';