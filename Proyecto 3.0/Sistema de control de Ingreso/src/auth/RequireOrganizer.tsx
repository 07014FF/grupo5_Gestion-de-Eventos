import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireOrganizer({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/iniciar-sesion" state={{ from: loc.pathname }} replace />;
  return children;
}
