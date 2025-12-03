import { apiClient } from "../../shared/lib/http";

export interface Category {
  id: number;
  name: string;
  color?: string;
  description?: string;
  displayOrder?: number;
}

export const listCategoriesApi = async (): Promise<Category[]> => {
  const { data } = await apiClient().post<{ categories: Category[] }>(
    "/categories/list",
    {}
  );
  return data.categories;
};

export interface CreateCategoryPayload {
  name: string;
  color?: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
}

export const createCategoryApi = async (
  payload: CreateCategoryPayload
): Promise<Category> => {
  const { data } = await apiClient().post<{ message: string; category: Category }>(
    "/categories/create",
    payload
  );
  return data.category;
};

export const updateCategoryApi = async (
  id: number,
  payload: UpdateCategoryPayload
): Promise<Category> => {
  const { data } = await apiClient().put<{ message: string; category: Category }>(
    `/categories/${id}`,
    payload
  );
  return data.category;
};

export const deleteCategoryApi = async (id: number): Promise<void> => {
  await apiClient().delete<{ message: string }>(`/categories/${id}`);
};
