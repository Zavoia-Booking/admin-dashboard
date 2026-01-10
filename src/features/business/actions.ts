import { createAsyncAction } from 'typesafe-actions';
import type { Business, UpdateBusinessDTO } from './types';

export const fetchCurrentBusinessAction = createAsyncAction(
  'business/FETCH_CURRENT_REQUEST',
  'business/FETCH_CURRENT_SUCCESS',
  'business/FETCH_CURRENT_FAILURE'
)<void, Business, { message: string }>();

export const updateBusinessAction = createAsyncAction(
  'business/UPDATE_BUSINESS_REQUEST',
  'business/UPDATE_BUSINESS_SUCCESS',
  'business/UPDATE_BUSINESS_FAILURE'
)<UpdateBusinessDTO, { message: string }, { message: string }>();


