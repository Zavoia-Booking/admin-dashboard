import { createAsyncAction } from "typesafe-actions";
import type { Category } from "./api";

export const listCategoriesAction = createAsyncAction(
  "CATEGORIES/LIST/REQUEST",
  "CATEGORIES/LIST/SUCCESS",
  "CATEGORIES/LIST/FAILURE"
)<void, Category[], unknown>();
