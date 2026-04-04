import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/PrivateRoute";
import { DarkModeProvider } from "./contexts/DarkModeContext";

import Login from "./auth/Login";
import SuperAdminLogin from "./auth/SuperAdminLogin";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminPrompts from "./pages/admin/Prompts";
import AIChat from "./pages/admin/AIChat";

import Help from "./pages/admin/Help";
import ContentPrompts from "./pages/content/Prompts";
import ViewerPrompts from "./pages/viewer/Prompts";
import Users from "./pages/admin/Users";
import Dashboard from "./pages/superadmin/Dashboard";
import PromptTypes from "./pages/admin/PromptTypes";
import ViralLens from "./pages/admin/ViralLens";
import ProductionHub from "./pages/admin/ProductionHub";

export default function App() {
  return (
    <DarkModeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "8px",
            background: "var(--toast-bg, #ffffff)",
            color: "var(--toast-color, #334155)",
            border: "1px solid var(--toast-border, #e2e8f0)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 9999
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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

        <Route
          path="/admin/ai-chat"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AIChat />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/viral-lens"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <ViralLens />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/production-hub"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <ProductionHub />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/help"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <Help />
            </PrivateRoute>
          }
        />
      </Routes>
    </DarkModeProvider>
  );
}