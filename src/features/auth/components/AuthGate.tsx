import { type PropsWithChildren, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthStatus, selectCurrentUser } from "../selectors";
import { AuthStatusEnum } from "../types";
import { fetchCurrentUserAction } from "../actions";
import { Spinner } from "../../../shared/components/ui/spinner";

export default function AuthGate({ children }: PropsWithChildren) {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (status === AuthStatusEnum.IDLE) {
      dispatch({ type: "auth/HYDRATE_SESSION_REQUEST" });
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (status === AuthStatusEnum.AUTHENTICATED && !user) {
      dispatch(fetchCurrentUserAction.request());
    }
  }, [status, user, dispatch]);

  // Show loading spinner while:
  // 1. Auth status is idle or loading (initial hydration)
  // 2. User is authenticated but user data hasn't loaded yet (prevents sidebar flicker)
  const isInitializing = status === AuthStatusEnum.IDLE || status === AuthStatusEnum.LOADING;
  const isWaitingForUserData = status === AuthStatusEnum.AUTHENTICATED && !user;

  if (isInitializing || isWaitingForUserData) {
    return (
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
