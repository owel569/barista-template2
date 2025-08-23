"use client"

import * as React from 'react'
import { cva, type VariantProps } from "class-variance-authority"
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { sanitizeString, validatePhone } from '@/lib/security'

// Interface pour un pays
interface Country {
  readonly code: string
  readonly flag: string
  readonly name: string
  readonly dialCode: string
  readonly pattern: string
  readonly placeholder: string
  readonly maxLength: number
}

// Pays les plus courants pour Barista Café (Maroc + touristes fréquents)
const COUNTRIES: readonly Country[] = [
  { code: 'MA', flag: '🇲🇦', name: 'Maroc', dialCode: '+212', pattern: '[0-9]{9}', placeholder: '612345678', maxLength: 9 },
  { code: 'FR', flag: '🇫🇷', name: 'France', dialCode: '+33', pattern: '[0-9]{9}', placeholder: '612345678', maxLength: 9 },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne', dialCode: '+34', pattern: '[0-9]{9}', placeholder: '612345678', maxLength: 9 },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique', dialCode: '+32', pattern: '[0-9]{8,9}', placeholder: '12345678', maxLength: 9 },
  { code: 'US', flag: '🇺🇸', name: 'États-Unis', dialCode: '+1', pattern: '[0-9]{10}', placeholder: '2025551234', maxLength: 10 },
  { code: 'GB', flag: '🇬🇧', name: 'Royaume-Uni', dialCode: '+44', pattern: '[0-9]{10}', placeholder: '7123456789', maxLength: 10 },
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne', dialCode: '+49', pattern: '[0-9]{10,11}', placeholder: '1234567890', maxLength: 11 },
  { code: 'IT', flag: '🇮🇹', name: 'Italie', dialCode: '+39', pattern: '[0-9]{8,10}', placeholder: '3123456789', maxLength: 10 },
  { code: 'NL', flag: '🇳🇱', name: 'Pays-Bas', dialCode: '+31', pattern: '[0-9]{9}', placeholder: '612345678', maxLength: 9 },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse', dialCode: '+41', pattern: '[0-9]{9}', placeholder: '791234567', maxLength: 9 },
] as const

const phoneInputVariants = cva(
  "flex",
  {
    variants: {
      variant: {
        default: "",
        compact: "space-x-1",
        separated: "space-x-3",
      },
      size: {
        sm: "text-sm",
        default: "",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InternationalPhoneInputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>,
    VariantProps<typeof phoneInputVariants> {
  value?: string
  onChange?: (value: string, isValid: boolean) => void
  onCountryChange?: (country: Country) => void
  defaultCountry?: string
  countries?: readonly Country[]
  showFlag?: boolean
  showCountryName?: boolean
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
}

export const InternationalPhoneInput = React.forwardRef<
  HTMLInputElement, 
  InternationalPhoneInputProps
>(({ 
  value = '', 
  onChange, 
  onCountryChange,
  defaultCountry = 'MA',
  countries = COUNTRIES,
  showFlag = true,
  showCountryName = false,
  variant,
  size,
  className,
  disabled = false,
  required = false,
  error,
  helperText,
  placeholder,
  ...props 
}, ref) => {
  // Fonction sécurisée pour extraire le pays à partir de la valeur
  const getCountryFromValue = React.useCallback((phoneValue: string): Country => {
    if (!phoneValue) {
      return countries.find(c => c.code === defaultCountry) || countries[0]
    }

    const sanitizedValue = sanitizeString(phoneValue, { maxLength: 20 })
    const country = countries.find(c => sanitizedValue.startsWith(c.dialCode))
    return country || countries.find(c => c.code === defaultCountry) || countries[0]
  }, [countries, defaultCountry])

  // Fonction sécurisée pour extraire le numéro de téléphone
  const getPhoneNumberFromValue = React.useCallback((phoneValue: string, country: Country): string => {
    if (!phoneValue) return ''
    
    const sanitizedValue = sanitizeString(phoneValue, { maxLength: 20 })
    return sanitizedValue.startsWith(country.dialCode) 
      ? sanitizedValue.slice(country.dialCode.length)
      : sanitizedValue
  }, [])

  // États avec validation
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(() => 
    getCountryFromValue(value)
  )
  const [phoneNumber, setPhoneNumber] = React.useState<string>(() => 
    getPhoneNumberFromValue(value, getCountryFromValue(value))
  )
  const [isValid, setIsValid] = React.useState<boolean>(false)

  // Validation du numéro de téléphone
  const validatePhoneNumber = React.useCallback((number: string, country: Country): boolean => {
    if (!number) return !required
    
    // Validation basique de longueur
    const cleanNumber = number.replace(/\D/g, '')
    if (cleanNumber.length === 0) return !required
    if (cleanNumber.length > country.maxLength) return false
    
    // Validation avec regex du pattern du pays
    const regex = new RegExp(`^${country.pattern}$`)
    return regex.test(cleanNumber)
  }, [required])

  // Gestionnaire sécurisé de changement de pays
  const handleCountryChange = React.useCallback((countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return

    setSelectedCountry(country)
    
    // Valider le numéro existant avec le nouveau pays
    const valid = validatePhoneNumber(phoneNumber, country)
    setIsValid(valid)
    
    const fullNumber = phoneNumber ? `${country.dialCode}${phoneNumber}` : ''
    onChange?.(fullNumber, valid)
    onCountryChange?.(country)
  }, [countries, phoneNumber, onChange, onCountryChange, validatePhoneNumber])

  // Gestionnaire sécurisé de changement de numéro
  const handlePhoneNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Sanitisation et validation de l'input
    const sanitizedValue = sanitizeString(inputValue, { 
      maxLength: selectedCountry.maxLength,
      allowedChars: /^[0-9\s\-\(\)\+]*$/ 
    })
    
    // Nettoyer pour ne garder que les chiffres
    const cleanNumber = sanitizedValue.replace(/\D/g, '')
    
    // Limiter à la longueur maximale du pays
    const truncatedNumber = cleanNumber.slice(0, selectedCountry.maxLength)
    
    setPhoneNumber(truncatedNumber)
    
    // Validation
    const valid = validatePhoneNumber(truncatedNumber, selectedCountry)
    setIsValid(valid)
    
    // Construire le numéro complet
    const fullNumber = truncatedNumber ? `${selectedCountry.dialCode}${truncatedNumber}` : ''
    onChange?.(fullNumber, valid)
  }, [selectedCountry, onChange, validatePhoneNumber])

  // Effet pour synchroniser avec les props externes
  React.useEffect(() => {
    if (value !== undefined) {
      const country = getCountryFromValue(value)
      const number = getPhoneNumberFromValue(value, country)
      
      if (country.code !== selectedCountry.code) {
        setSelectedCountry(country)
      }
      
      if (number !== phoneNumber) {
        setPhoneNumber(number)
      }
      
      const valid = validatePhoneNumber(number, country)
      setIsValid(valid)
    }
  }, [value, getCountryFromValue, getPhoneNumberFromValue, selectedCountry.code, phoneNumber, validatePhoneNumber])

  // ID unique pour l'accessibilité
  const inputId = React.useId()
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <div className="space-y-2">
      <div className={cn(phoneInputVariants({ variant, size }), className)}>
        {/* Sélecteur de pays */}
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger 
            className={cn(
              "w-auto min-w-[120px]",
              error && "border-destructive"
            )}
            aria-label="Sélectionner le pays"
          >
            <SelectValue>
              <div className="flex items-center space-x-2">
                {showFlag && (
                  <span className="text-lg" role="img" aria-label={selectedCountry.name}>
                    {selectedCountry.flag}
                  </span>
                )}
                <span className="font-mono text-sm">
                  {selectedCountry.dialCode}
                </span>
                {showCountryName && (
                  <span className="hidden sm:inline text-sm">
                    {selectedCountry.name}
                  </span>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center space-x-3">
                  <span className="text-lg" role="img" aria-label={country.name}>
                    {country.flag}
                  </span>
                  <span className="font-mono text-sm min-w-[3rem]">
                    {country.dialCode}
                  </span>
                  <span className="text-sm">
                    {country.name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Input du numéro de téléphone */}
        <div className="flex-1 relative">
          <Input
            ref={ref}
            id={inputId}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder || selectedCountry.placeholder}
            maxLength={selectedCountry.maxLength}
            pattern={selectedCountry.pattern}
            className={cn(
              "font-mono",
              error && "border-destructive",
              isValid && phoneNumber && "border-green-500"
            )}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={cn(
              error && errorId,
              helperText && helperId
            )}
            {...props}
          />
          
          {/* Indicateur de validation */}
          {phoneNumber && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" aria-label="Numéro valide" />
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full" aria-label="Numéro invalide" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages d'aide et d'erreur */}
      {(error || helperText) && (
        <div className="space-y-1">
          {error && (
            <p
              id={errorId}
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {sanitizeString(error, { maxLength: 200 })}
            </p>
          )}
          {helperText && !error && (
            <p
              id={helperId}
              className="text-sm text-muted-foreground"
            >
              {sanitizeString(helperText, { maxLength: 200 })}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

InternationalPhoneInput.displayName = 'InternationalPhoneInput'

// Hook pour utiliser le composant avec validation
export function useInternationalPhoneInput(
  initialValue: string = '',
  initialCountry: string = 'MA'
) {
  const [value, setValue] = React.useState(initialValue)
  const [isValid, setIsValid] = React.useState(false)
  const [country, setCountry] = React.useState<Country | null>(null)

  const handleChange = React.useCallback((newValue: string, valid: boolean) => {
    setValue(newValue)
    setIsValid(valid)
  }, [])

  const handleCountryChange = React.useCallback((newCountry: Country) => {
    setCountry(newCountry)
  }, [])

  const reset = React.useCallback(() => {
    setValue('')
    setIsValid(false)
    setCountry(null)
  }, [])

  const validateCurrent = React.useCallback(() => {
    if (!value || !country) return false
    return validatePhone(value)
  }, [value, country])

  return {
    value,
    isValid,
    country,
    onChange: handleChange,
    onCountryChange: handleCountryChange,
    reset,
    validate: validateCurrent,
  }
}

// Composant simplifié pour les cas d'usage basiques
export interface SimplePhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const SimplePhoneInput: React.FC<SimplePhoneInputProps> = ({
  value,
  onChange,
  ...props
}) => {
  const handleChange = React.useCallback((newValue: string, isValid: boolean) => {
    onChange?.(newValue)
  }, [onChange])

  return (
    <InternationalPhoneInput
      value={value}
      onChange={handleChange}
      {...props}
    />
  )
}

export { COUNTRIES, phoneInputVariants }
export type { Country }