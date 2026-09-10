"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CUSTOMER_LANG_KEY,
  getCustomerCopy,
  type CustomerCopy,
  type CustomerLocale,
} from "@/lib/customer-copy";

type CustomerLocaleContextValue = {
  locale: CustomerLocale;
  copy: CustomerCopy;
  setLocale: (locale: CustomerLocale) => void;
  toggleLocale: () => void;
};

const CustomerLocaleContext = createContext<CustomerLocaleContextValue | null>(null);

function readSavedLocale(): CustomerLocale {
  try {
    const saved = localStorage.getItem(CUSTOMER_LANG_KEY);
    if (saved === "hi" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

export function CustomerLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<CustomerLocale>("en");

  useEffect(() => {
    setLocaleState(readSavedLocale());
  }, []);

  const setLocale = useCallback((next: CustomerLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(CUSTOMER_LANG_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "hi" ? "hi" : "en";
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "hi" : "en");
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CUSTOMER_LANG_KEY) return;
      if (event.newValue === "hi" || event.newValue === "en") {
        setLocaleState(event.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      copy: getCustomerCopy(locale),
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <CustomerLocaleContext.Provider value={value}>{children}</CustomerLocaleContext.Provider>
  );
}

export function useCustomerLocale() {
  const ctx = useContext(CustomerLocaleContext);
  if (!ctx) {
    const locale: CustomerLocale = "en";
    return {
      locale,
      copy: getCustomerCopy(locale),
      setLocale: () => {},
      toggleLocale: () => {},
    };
  }
  return ctx;
}
