
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/router";
import {Provider} from "react-redux";
import type { AppProps } from "next/app";
import {store} from "@/store/store"

function App({ Component }: AppProps) {
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

  return (
    <Provider store={store}>
      <Component/>
      <Toaster position="top-right" />
    </Provider>
  );
}

export default App;
