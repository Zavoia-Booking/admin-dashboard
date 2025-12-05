import { createAsyncAction } from "typesafe-actions";
import type { CreateBundlePayload, UpdateBundlePayload, Bundle } from "./types.ts";

export const listBundlesAction = createAsyncAction(
  "LIST/BUNDLES/REQUEST",
  "LIST/BUNDLES/SUCCESS",
  "LIST/BUNDLES/FAILURE"
)<void, Bundle[], { message: string }>();

export const createBundleAction = createAsyncAction(
  "CREATE/BUNDLE/REQUEST",
  "CREATE/BUNDLE/SUCCESS",
  "CREATE/BUNDLE/FAILURE"
)<CreateBundlePayload, { message: string }, { message: string }>();

export const updateBundleAction = createAsyncAction(
  "UPDATE/BUNDLE/REQUEST",
  "UPDATE/BUNDLE/SUCCESS",
  "UPDATE/BUNDLE/FAILURE"
)<UpdateBundlePayload, { message: string }, { message: string }>();

export const deleteBundleAction = createAsyncAction(
  "DELETE/BUNDLE/REQUEST",
  "DELETE/BUNDLE/SUCCESS",
  "DELETE/BUNDLE/FAILURE"
)<{ id: number }, { message: string }, { message: string }>();

