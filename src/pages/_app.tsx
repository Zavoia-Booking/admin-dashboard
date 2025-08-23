
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/router";
import {Provider} from "react-redux";
import type { AppProps } from "next/app";
import {store} from "@/store/store"
import {NextIntlClientProvider} from "next-intl";

type IntlAppProps = AppProps<{
  messages: Record<string, unknown>;
  locale: string;
}>;

export default function App({ Component, pageProps  }: IntlAppProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { messages, locale } = pageProps;

  return (
    <NextIntlClientProvider  messages={messages} locale={locale}>
      <Provider store={store}>
        <Component/>
        <Toaster position="top-right" />
      </Provider>
    </NextIntlClientProvider>
  );
}

App.getInitialProps = async (appCtx: any) => {
  const { ctx } = appCtx;
  const locale = ctx?.locale || "en";

  let messages: Record<string, unknown> = {};
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    // Fallback to default locale if missing
    messages = (await import(`../messages/en.json`)).default;
  }

  // Merge with any existing pageProps from pages’ getInitialProps/getServerSideProps/getStaticProps
  const appProps =
      (typeof (await import("next/app")).default.getInitialProps === "function"
          ? await (await import("next/app")).default.getInitialProps(appCtx)
          : { pageProps: {} });

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      messages,
      locale
    }
  };
};