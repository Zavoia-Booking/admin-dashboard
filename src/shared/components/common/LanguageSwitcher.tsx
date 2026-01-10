import React from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';

// Flag components as SVG
const USFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="#B22234"/>
    <rect y="1" width="20" height="1" fill="white"/>
    <rect y="3" width="20" height="1" fill="white"/>
    <rect y="5" width="20" height="1" fill="white"/>
    <rect y="7" width="20" height="1" fill="white"/>
    <rect y="9" width="20" height="1" fill="white"/>
    <rect y="11" width="20" height="1" fill="white"/>
    <rect y="13" width="20" height="1" fill="white"/>
    <rect width="8" height="8" fill="#3C3B6E"/>
  </svg>
);

const ROFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="#FCD116"/>
    <rect width="6.67" height="15" rx="2" fill="#002B7F"/>
    <rect x="13.33" width="6.67" height="15" rx="2" fill="#CE1126"/>
  </svg>
);

const languages = [
  { code: 'en', name: 'English', flag: <USFlag /> },
  { code: 'ro', name: 'Română', flag: <ROFlag /> },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full h-full justify-center px-3 py-2 rounded-none hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:px-0"
        >
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
            {currentLanguage.flag}
            <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">{currentLanguage.code.toUpperCase()}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {language.flag}
              <span>{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
