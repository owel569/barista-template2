import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

const languageNames = {
  fr: "Français",
  en: "English", 
  zh: "中文",
  hi: "हिन्दी",
  es: "Español"
};

const languageFlags = {
  fr: "🇫🇷",
  en: "🇺🇸",
  zh: "🇨🇳", 
  hi: "🇮🇳",
  es: "🇪🇸"
};

export default function LanguageSelector() : void {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 justify-start">
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.language')}</span>
          <span className="text-sm">{languageFlags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`gap-2 ${language === code ? 'bg-accent' : ''}`}
          >
            <span>{languageFlags[code as Language]}</span>
            <span>{name}</span>
            {language === code && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}