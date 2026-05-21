export interface Service {
  id: number | string;
  name: string;
  price?: number;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: number; name: string; color?: string } | null;
}

export interface CategoryGroup {
  categoryId: number | null;
  categoryName: string;
  categoryColor?: string;
  services: Service[];
}

export type SortField = "name" | "price" | "duration" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export interface CurrencyDisplay {
  /** ISO 4217 code (e.g. `'RON'`, `'EUR'`). Carried alongside the icon/symbol
   *  so children can format numbers with the right grouping/decimals via
   *  the shared currency util without re-deriving the code. */
  currency: string;
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string;
}

