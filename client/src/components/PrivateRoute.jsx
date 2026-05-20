import { Navigate } from "react-router-dom";
import { getRole } from "../utils/api";

/** Default landing route per role when the user hits a route they are not allowed to use */
const ROLE_HOME = {
  admin: "/admin",
  content_manager: "/content/prompts",
  viewer: "/viewer",
  voice_over: "/admin/voice-over",
  superadmin: "/superadmin",
};

export default function PrivateRoute({ children, allowedRoles }) {
  const role = getRole();

  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) {
    const home = ROLE_HOME[role];
    if (home) return <Navigate to={home} replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
