import { createAsyncAction } from 'typesafe-actions';
import type { Business } from './types';

export const fetchCurrentBusinessAction = createAsyncAction(
  'business/FETCH_CURRENT_REQUEST',
  'business/FETCH_CURRENT_SUCCESS',
  'business/FETCH_CURRENT_FAILURE'
)<void, Business, { message: string }>();


