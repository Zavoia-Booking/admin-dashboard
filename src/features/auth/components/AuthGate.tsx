import { type PropsWithChildren, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthStatus, selectCurrentUser } from "../selectors";
import { AuthStatusEnum } from "../types";
import { fetchCurrentUserAction } from "../actions";

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
    // Customized loader here to be added
    return null;
  }

  return <>{children}</>;
}
