import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { listCategoriesAction } from "./actions";
import { listCategoriesApi, type Category } from "./api";
import { toast } from "sonner";
import { getErrorMessage } from "../../shared/utils/error";
import type { RootState } from "../../app/providers/store";

function* handleListCategories(): Generator<any, void, any> {
  try {
    const categories: Category[] = yield call(listCategoriesApi);
    yield put(listCategoriesAction.success(categories));
  } catch (error: unknown) {
    console.error("Failed to load categories:", error);
    const errorMessage = getErrorMessage(error);
    yield put(listCategoriesAction.failure({ message: errorMessage }));
    const hasRetainedCategories: boolean = yield select(
      (state: RootState) => state.categories.categories.length > 0,
    );
    if (hasRetainedCategories) {
      toast.error(errorMessage);
    }
  }
}

export function* categoriesSaga(): Generator<unknown, void, unknown> {
  yield all([
    takeLatest(listCategoriesAction.request, handleListCategories),
  ]);
}
