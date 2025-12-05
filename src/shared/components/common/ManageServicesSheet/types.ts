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
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string;
}

