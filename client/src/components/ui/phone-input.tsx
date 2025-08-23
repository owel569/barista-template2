import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Liste des pays avec indicatifs téléphoniques
const countries: Country[] = [
  // Pays favoris en haut
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  // Séparateur
  { code: 'separator', name: '──────────', dialCode: '', flag: '' },
  // Autres pays par ordre alphabétique
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'LB', name: 'Liban', dialCode: '+961', flag: '🇱🇧' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' }
];

const favoriteCountriesCodes = ['MA', 'FR', 'ES', 'BE'];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string, formattedValue: string, isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  placeholder = '6 12 34 56 78',
  disabled = false,
  required = false,
  className = '',
  label = 'Téléphone',
  id = 'phone'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Maroc par défaut
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<Country | null>(null);

  // Géolocalisation automatique (optionnel)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // API pour détecter le pays basé sur la géolocalisation
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=fr`
            );
            const data = await response.json();
            const countryCode = data.countryCode;
            
            const detectedCountryObj = countries.find(c => c.code === countryCode);
            if (detectedCountryObj && detectedCountryObj.code !== 'separator') {
              setDetectedCountry(detectedCountryObj);
            }
          } catch (error) {
            console.log('Géolocalisation non disponible:', error);
          }
        },
        () => {
          // Erreur ou permission refusée - utiliser Maroc par défaut
        }
      );
    }
  }, []);

  // Initialiser avec la valeur existante
  useEffect(() => {
    if (value) {
      // Analyser le numéro pour extraire l'indicatif et le numéro
      const foundCountry = countries.find(c => 
        c.code !== 'separator' && value.startsWith(c.dialCode)
      );
      if (foundCountry) {
        setSelectedCountry(foundCountry);
        setPhoneNumber(value.substring(foundCountry.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Filtrer les pays selon la recherche
  const filteredCountries = countries.filter(country => {
    if (country.code === 'separator') return true;
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.dialCode.includes(search)
    );
  });

  // Formater le numéro de téléphone
  const formatPhoneNumber = (number: string) => {
    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    const cleaned = number.replace(/[^\d]/g, '');
    
    // Formater selon le pays
    if (selectedCountry.code === 'MA') {
      // Format marocain: 6 12 34 56 78
      if (cleaned.length >= 9) {
        return cleaned.substring(0, 1) + ' ' + 
               cleaned.substring(1, 3) + ' ' + 
               cleaned.substring(3, 5) + ' ' + 
               cleaned.substring(5, 7) + ' ' + 
               cleaned.substring(7, 9);
      }
    } else if (selectedCountry.code === 'FR') {
      // Format français: 01 23 45 67 89
      if (cleaned.length >= 10) {
        return cleaned.substring(0, 2) + ' ' + 
               cleaned.substring(2, 4) + ' ' + 
               cleaned.substring(4, 6) + ' ' + 
               cleaned.substring(6, 8) + ' ' + 
               cleaned.substring(8, 10);
      }
    }
    
    // Format par défaut avec espaces tous les 2 chiffres
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
  };

  // Valider le numéro
  const validatePhoneNumber = (number: string, country: Country) => {
    const cleaned = number.replace(/[^\d]/g, '');
    
    if (country.code === 'MA') {
      return cleaned.length === 9 && cleaned.startsWith('6');
    } else if (country.code === 'FR') {
      return cleaned.length === 10 && cleaned.startsWith('0');
    }
    
    // Validation générale: au moins 7 chiffres
    return cleaned.length >= 7;
  };

  const handlePhoneChange = (newNumber: string) => {
    const formatted = formatPhoneNumber(newNumber);
    setPhoneNumber(formatted);
    
    const fullNumber = selectedCountry.dialCode + ' ' + formatted;
    const isValid = validatePhoneNumber(newNumber, selectedCountry);
    
    onChange?.(fullNumber, formatted, isValid);
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country && country.code !== 'separator') {
      setSelectedCountry(country);
      setIsDropdownOpen(false);
      
      const fullNumber = country.dialCode + ' ' + phoneNumber;
      const isValid = validatePhoneNumber(phoneNumber, country);
      onChange?.(fullNumber, phoneNumber, isValid);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      {/* Option géolocalisation */}
      {detectedCountry && detectedCountry.code !== selectedCountry.code && (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            Pays détecté: {detectedCountry.flag} {detectedCountry.name}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCountryChange(detectedCountry.code)}
            className="text-xs"
          >
            Utiliser
          </Button>
        </div>
      )}
      
      <div className="flex space-x-2">
        {/* Sélecteur de pays */}
        <Select 
          value={selectedCountry.code} 
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Barre de recherche */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            
            {/* Pays favoris en premier */}
            {!searchTerm && (
              <>
                <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">
                  Pays favoris
                </div>
                {countries.filter(c => favoriteCountriesCodes.includes(c.code)).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {country.dialCode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                <div className="border-t mx-2 my-1"></div>
                <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">
                  Tous les pays
                </div>
              </>
            )}
            
            {/* Liste filtrée des pays */}
            {filteredCountries.map((country) => {
              if (country.code === 'separator') {
                return <div key="sep" className="border-t mx-2 my-1" />;
              }
              
              // Ne pas répéter les pays favoris
              if (!searchTerm && favoriteCountriesCodes.includes(country.code)) {
                return null;
              }
              
              return (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm">{country.name}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {country.dialCode}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* Champ numéro de téléphone */}
        <Input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="flex-1"
        />
      </div>
      
      {/* Exemple de format */}
      <p className="text-xs text-gray-500">
        <span className="font-mono">{selectedCountry.flag} {selectedCountry.dialCode}</span>
        {' '}Exemple: {selectedCountry.code === 'MA' ? '6 12 34 56 78' : 
                     selectedCountry.code === 'FR' ? '01 23 45 67 89' :
                     selectedCountry.code === 'US' ? '555 123 4567' : '12 34 56 78'}
      </p>
    </div>
  );
}