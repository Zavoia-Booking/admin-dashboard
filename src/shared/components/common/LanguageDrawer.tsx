import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { languages } from './languages';

/**
 * Language selector that opens a bottom drawer — the mobile counterpart of
 * LanguageSwitcher's dropdown, built to scale past two languages. The trigger
 * is a quiet ghost button showing the active language.
 */
export function LanguageDrawer() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current =
    languages.find((lang) => lang.code === i18n.resolvedLanguage) || languages[0];

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-foreground-2 hover:text-foreground-1 font-medium cursor-pointer"
        >
          <Globe aria-hidden />
          {current.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('common:changeLanguage')}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t('common:changeLanguage')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2">
          {languages.map((language) => {
            const isActive = i18n.resolvedLanguage === language.code;
            return (
              <button
                key={language.code}
                type="button"
                lang={language.code}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => selectLanguage(language.code)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between rounded-lg border px-4 py-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none cursor-pointer',
                  isActive
                    ? 'bg-surface-active font-medium border-border'
                    : 'bg-surface border-border hover:bg-surface-hover',
                )}
              >
                <div className="flex items-center gap-2">
                  {language.flag}
                  <span>{language.name}</span>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
