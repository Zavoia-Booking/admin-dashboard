import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { installPushListeners } from "./service";

export default function PushListenersBootstrap() {
  const navigate = useNavigate();

  useEffect(() => {
    installPushListeners((path) => navigate(path));
  }, [navigate]);

  return null;
}
