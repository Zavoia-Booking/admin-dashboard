import { takeLatest, call, put, all, select, cancelled } from "redux-saga/effects";
import {
  fetchReviewStatsAction,
  fetchBusinessReviewsAction,
  fetchMoreBusinessReviewsAction,
  fetchTeamMemberReviewsAction,
  fetchMoreTeamMemberReviewsAction,
  fetchHighlightReviewsAction,
} from "./actions";
import { enterWebsiteBuilderAction } from "../website/actions";
import {
  getReviewStatsApi,
  getBusinessReviewsApi,
  getTeamMemberReviewsApi,
} from "./api";
import type {
  ReviewStatsResponse,
  BusinessReviewsResponse,
  TeamMemberReviewsResponse,
} from "./types";
import { getType, type ActionType } from "typesafe-actions";
import { toast } from "sonner";
import { getErrorMessage } from "../../shared/utils/error";
import type { RootState } from "../../app/providers/store";

function* getReviewsScopeBusinessId(): Generator<any, string | null, any> {
  return yield select((state: RootState) => state.auth.businessId);
}

function* isCurrentReviewsScope(scopeBusinessId: string | null): Generator<any, boolean, any> {
  const currentScopeBusinessId: string | null = yield select(
    (state: RootState) => state.auth.businessId,
  );
  return currentScopeBusinessId === scopeBusinessId;
}

function* handleFetchReviewStats(action: { type: string }): Generator<any, void, any> {
  // Website ENTER shares this takeLatest lane only to suppress a retained in-flight result.
  // The fresh editable workspace dispatches the replacement request after its primary GET.
  if (action.type === getType(enterWebsiteBuilderAction)) return;
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  const abortController = new AbortController();
  try {
    const response: ReviewStatsResponse = yield call(getReviewStatsApi, {
      signal: abortController.signal,
    });
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchReviewStatsAction.success({ ...response.data, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    yield put(fetchReviewStatsAction.failure({ message, scopeBusinessId }));
  } finally {
    if (yield cancelled()) abortController.abort();
  }
}

function* handleFetchBusinessReviews(
  action: ActionType<typeof fetchBusinessReviewsAction.request>,
) {
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  try {
    const response: BusinessReviewsResponse = yield call(
      getBusinessReviewsApi,
      action.payload,
    );
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchBusinessReviewsAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    yield put(fetchBusinessReviewsAction.failure({ message, scopeBusinessId }));
  }
}

function* handleFetchMoreBusinessReviews(
  action: ActionType<typeof fetchMoreBusinessReviewsAction.request>,
) {
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  try {
    const response: BusinessReviewsResponse = yield call(
      getBusinessReviewsApi,
      action.payload,
    );
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchMoreBusinessReviewsAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    // The loaded rows are still valid — a toast is the whole feedback.
    const message = getErrorMessage(error);
    toast.error(message);
    yield put(fetchMoreBusinessReviewsAction.failure({ message, scopeBusinessId }));
  }
}

function* handleFetchTeamMemberReviews(
  action: ActionType<typeof fetchTeamMemberReviewsAction.request>,
) {
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  try {
    const response: TeamMemberReviewsResponse = yield call(
      getTeamMemberReviewsApi,
      action.payload,
    );
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchTeamMemberReviewsAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    yield put(fetchTeamMemberReviewsAction.failure({ message, scopeBusinessId }));
  }
}

function* handleFetchMoreTeamMemberReviews(
  action: ActionType<typeof fetchMoreTeamMemberReviewsAction.request>,
) {
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  try {
    const response: TeamMemberReviewsResponse = yield call(
      getTeamMemberReviewsApi,
      action.payload,
    );
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchMoreTeamMemberReviewsAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    toast.error(message);
    yield put(fetchMoreTeamMemberReviewsAction.failure({ message, scopeBusinessId }));
  }
}

function* handleFetchHighlightReviews(
  action:
    | ActionType<typeof fetchHighlightReviewsAction.request>
    | ActionType<typeof enterWebsiteBuilderAction>,
): Generator<any, void, any> {
  if (action.type === getType(enterWebsiteBuilderAction)) return;
  const scopeBusinessId: string | null = yield* getReviewsScopeBusinessId();
  const abortController = new AbortController();
  try {
    const response: BusinessReviewsResponse = yield call(
      getBusinessReviewsApi,
      action.payload,
      { signal: abortController.signal },
    );
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    yield put(fetchHighlightReviewsAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentReviewsScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    yield put(fetchHighlightReviewsAction.failure({ message, scopeBusinessId }));
  } finally {
    if (yield cancelled()) abortController.abort();
  }
}

export function* reviewsSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(
      [fetchReviewStatsAction.request, enterWebsiteBuilderAction],
      handleFetchReviewStats,
    ),
    takeLatest(fetchBusinessReviewsAction.request, handleFetchBusinessReviews),
    takeLatest(
      [fetchHighlightReviewsAction.request, enterWebsiteBuilderAction],
      handleFetchHighlightReviews,
    ),
    takeLatest(
      fetchMoreBusinessReviewsAction.request,
      handleFetchMoreBusinessReviews,
    ),
    takeLatest(
      fetchTeamMemberReviewsAction.request,
      handleFetchTeamMemberReviews,
    ),
    takeLatest(
      fetchMoreTeamMemberReviewsAction.request,
      handleFetchMoreTeamMemberReviews,
    ),
  ]);
}
