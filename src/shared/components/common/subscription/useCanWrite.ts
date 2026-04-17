import { useSelector } from 'react-redux';
import { selectIsEntitled } from '../../../../features/auth/selectors';

/**
 * Returns true when the current business is entitled to perform writes
 * (active subscription, trial, LTD, canceled-in-grace). Returns false otherwise.
 *
 * Callers on always-writable surfaces (settings, support, account self-service)
 * should simply not gate their controls — this hook is for feature pages that
 * need to degrade to read-only.
 */
export function useCanWrite(): boolean {
  return useSelector(selectIsEntitled);
}
