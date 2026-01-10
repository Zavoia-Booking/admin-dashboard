import type { Category } from "./api";

export type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
};
