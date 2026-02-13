import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./auth/Login";
import SuperAdminLogin from "./auth/SuperAdminLogin";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminPrompts from "./pages/admin/Prompts";
import ContentPrompts from "./pages/content/Prompts";
import ViewerPrompts from "./pages/viewer/Prompts";
import Users from "./pages/admin/Users";
import Channels from "./pages/admin/Channels";
import Dashboard from "./pages/superadmin/Dashboard";
import PromptTypes from "./pages/admin/PromptTypes";



export default function App() {
  return (


    <>   <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
            zIndex: 9999
          }
        }}
      />
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
        path="/viewer"
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
      <Route
  path="/admin/prompt-types"
  element={
    <PrivateRoute allowedRoles={["admin"]}>
      <PromptTypes />
    </PrivateRoute>
  }
/>


    </Routes>
    </>
  );
}
