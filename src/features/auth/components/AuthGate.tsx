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

  if (status === AuthStatusEnum.IDLE || status === AuthStatusEnum.LOADING) {
    return (
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
