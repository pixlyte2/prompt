import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./auth/Login";
import SuperAdminLogin from "./auth/SuperAdminLogin";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminPrompts from "./pages/admin/Prompts";
import ContentPrompts from "./pages/content/Prompts";
import ViewerPrompts from "./pages/viewer/Prompts";
import Users from "./pages/admin/Users";
import Channels from "./pages/admin/Channels";
import Dashboard from "./pages/superadmin/Dashboard"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/superadmin-login" element={<SuperAdminLogin />} />

      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/prompts"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminPrompts />
          </PrivateRoute>
        }
      />

      <Route
        path="/content/prompts"
        element={
          <PrivateRoute allowedRoles={["content_manager"]}>
            <ContentPrompts />
          </PrivateRoute>
        }
      />

      <Route
        path="/viewer/prompts"
        element={
          <PrivateRoute allowedRoles={["viewer"]}>
            <ViewerPrompts />
          </PrivateRoute>
        }
      />

    <Route
        path="/admin/users"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <Users />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/channels"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <Channels />
          </PrivateRoute>
        }
      />
      <Route
        path="/superadmin"
        element={
          <PrivateRoute allowedRoles={["superadmin"]}>
            <Dashboard />
          </PrivateRoute>
        }
      />

    </Routes>
  );
}
