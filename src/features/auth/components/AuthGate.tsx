import { type PropsWithChildren, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthStatus } from "../selectors";
import { AuthStatusEnum } from "../types";

export default function AuthGate({ children }: PropsWithChildren) {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);

  useEffect(() => {
    if (status === AuthStatusEnum.IDLE) {
      dispatch({ type: "auth/HYDRATE_SESSION_REQUEST" });
    }
  }, [status, dispatch]);

  if (status === AuthStatusEnum.IDLE || status === AuthStatusEnum.LOADING) {
    // Customized loader here to be added
    return null;
  }

  return <>{children}</>;
}
