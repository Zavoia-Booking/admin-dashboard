import { apiClient } from "../../shared/lib/http";

export interface Category {
  id: number;
  name: string;
  color?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export const listCategoriesApi = async (): Promise<Category[]> => {
  const { data } = await apiClient().post<{ categories: Category[] }>(
    "/categories/list",
    {}
  );
  return data.categories;
};
