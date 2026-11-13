import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

/**
 * Sign in with Apple's registered Return URL (VITE_APPLE_REDIRECT_URI).
 * Apple JS runs in popup mode and hands the result to the opening tab, so this
 * page normally never shows; if Apple's popup does land here, it closes itself.
 */
export default function AppleCallbackPage() {
  const { t } = useTranslation('auth');

  useEffect(() => {
    try {
      window.close();
    } catch {
      /* not a script-opened window: the message below stays */
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground-1">{t('appleCallback.title')}</h1>
        <p className="text-sm text-foreground-2">{t('appleCallback.description')}</p>
      </div>
    </main>
  );
}
