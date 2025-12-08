import { all, call, put, takeLatest } from "redux-saga/effects";
import { listCategoriesAction } from "./actions";
import { listCategoriesApi, type Category } from "./api";
import { toast } from "sonner";
import { getErrorMessage } from "../../shared/utils/error";

function* handleListCategories(): Generator<any, void, any> {
  try {
    const categories: Category[] = yield call(listCategoriesApi);
    yield put(listCategoriesAction.success(categories));
  } catch (error: unknown) {
    console.error("Failed to load categories:", error);
    const errorMessage = getErrorMessage(error);
    toast.error("Failed to load categories");
    yield put(listCategoriesAction.failure({ message: errorMessage }));
  }
}

export function* categoriesSaga(): Generator<unknown, void, unknown> {
  yield all([
    takeLatest(listCategoriesAction.request, handleListCategories),
  ]);
}
