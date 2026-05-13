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

type LanguageSwitcherVariant = "sidebar" | "floating" | "embedded";

interface LanguageSwitcherProps {
  /**
   * Visual variant.
   * - "sidebar" (default): full-width row, used inside the app sidebar.
   * - "floating": standalone compact pill with border + backdrop blur.
   * - "embedded": bare trigger (no border / bg / shadow) for use inside a
   *   parent container that provides the chrome — e.g. the auth-page
   *   controls cluster that holds both this and the theme toggle.
   */
  variant?: LanguageSwitcherVariant;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = "sidebar" }) => {
  const { i18n, t } = useTranslation();

  // Use resolvedLanguage (always a bare code matching a loaded resource, e.g. 'ro')
  // rather than i18n.language (which can be a full locale like 'ro-RO' when the
  // browser detector picks it up, breaking the lookup against the bare codes below).
  const currentLanguage = languages.find(lang => lang.code === i18n.resolvedLanguage) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const triggerClassName =
    variant === "floating"
      ? "h-9 px-3 gap-1.5 rounded-md border border-border/60 bg-background/70 backdrop-blur-sm shadow-sm hover:bg-accent hover:border-border cursor-pointer"
      : variant === "embedded"
      ? "h-full px-3 gap-1.5 rounded-none border-0 bg-transparent shadow-none hover:bg-accent cursor-pointer"
      : "w-full h-full justify-center px-3 py-2 rounded-none hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:px-0";

  const innerWrapperClassName =
    variant === "sidebar"
      ? "flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
      : "flex items-center gap-2";

  const labelClassName =
    variant === "sidebar"
      ? "text-sm font-medium group-data-[collapsible=icon]:hidden"
      : "text-sm font-medium";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={t("common:changeLanguage")}
          className={triggerClassName}
        >
          <div className={innerWrapperClassName}>
            {currentLanguage.flag}
            <span className={labelClassName}>{currentLanguage.code.toUpperCase()}</span>
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
            {i18n.resolvedLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
