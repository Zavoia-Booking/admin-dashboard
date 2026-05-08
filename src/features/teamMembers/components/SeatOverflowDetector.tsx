import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../../auth/selectors';
import { UserRole } from '../../../shared/types/auth';
import {
  selectReconciliationMode,
  selectReconciliationOpen,
} from '../../reconciliation/selectors';
import { openReconciliationAction } from '../../reconciliation/actions';

const PERMITTED_DEFER_PATHS = ['/account', '/support', '/my-profile', '/my-account'];
const isPermittedDeferPath = (pathname: string) =>
  PERMITTED_DEFER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Watches entitlements and opens the reconciliation modal in `seat_overflow` mode
 * when the OWNER has more used seats than paid. Skips when the user is on a billing /
 * support / profile path so they can actually buy more seats. Renders nothing.
 */
export const SeatOverflowDetector: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser);
  const open = useSelector(selectReconciliationOpen);
  const mode = useSelector(selectReconciliationMode);

  const isEntitled = currentUser?.entitlements?.entitled ?? false;
  const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? 0;
  const usedSeats = currentUser?.entitlements?.usedSeats ?? 0;
  const isOverflowing =
    currentUser?.role === UserRole.OWNER && isEntitled && paidSeats > 0 && usedSeats > paidSeats;

  useEffect(() => {
    if (!isOverflowing) return;
    // Let the user reach billing / support / profile to resolve the overflow.
    if (isPermittedDeferPath(location.pathname)) return;
    // Don't override an explicit open in another mode (remove_member / unassign_from_location).
    if (open && mode !== null && mode !== 'seat_overflow') return;
    if (open && mode === 'seat_overflow') return;
    dispatch(openReconciliationAction({ mode: 'seat_overflow' }));
  }, [isOverflowing, open, mode, location.pathname, dispatch]);

  return null;
};

export default SeatOverflowDetector;
