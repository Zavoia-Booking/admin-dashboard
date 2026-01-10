import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/providers/store';
import type { Business } from './types';

export const getBusinessStateSelector = (state: RootState) => state.business;

export const getCurrentBusinessSelector = createSelector(
  getBusinessStateSelector,
  (state): Business | null => state.current
);

export const getBusinessLoadingSelector = createSelector(
  getBusinessStateSelector,
  (state): boolean => state.isLoading
);

export const getBusinessUpdatingSelector = createSelector(
  getBusinessStateSelector,
  (state): boolean => state.isUpdating
);

export const getBusinessUpdateErrorSelector = createSelector(
  getBusinessStateSelector,
  (state): string | null => state.updateError
);


