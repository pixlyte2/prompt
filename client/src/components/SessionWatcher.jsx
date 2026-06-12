import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api, { logout, saveAuth } from "../utils/api";

// Function to decode JWT securely in frontend
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export default function SessionWatcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // countdown in seconds
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const pathname = window.location.pathname;

      // Skip checking on login pages
      const isPublicPath =
        pathname === "/login" ||
        pathname === "/superadmin-login" ||
        pathname === "/";

      if (!token) {
        if (!isPublicPath) {
          logout();
          window.location.href = "/login";
        }
        setIsOpen(false);
        return;
      }

      const payload = parseJwt(token);
      if (!payload || !payload.exp) {
        if (!isPublicPath) {
          logout();
          window.location.href = "/login";
        }
        setIsOpen(false);
        return;
      }

      const expTimeMs = payload.exp * 1000;
      const remainingSeconds = Math.round((expTimeMs - Date.now()) / 1000);

      if (remainingSeconds <= 0) {
        logout();
        toast.error("Your session has expired. Please log in again.");
        window.location.href = "/login";
        setIsOpen(false);
      } else if (remainingSeconds <= 300) {
        // Show countdown modal when session is <= 5 mins
        setTimeLeft(remainingSeconds);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Run check immediately
    checkSession();

    // Check session every second
    const interval = setInterval(checkSession, 1000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleExtendSession = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.post("/auth/refresh");
      const { token, role } = res.data;

      const oldUserStr = localStorage.getItem("user");
      const parsedUser = oldUserStr ? JSON.parse(oldUserStr) : null;

      saveAuth(token, role, parsedUser);
      toast.success("Session extended successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session. Please log in again.");
      logout();
      window.location.href = "/login";
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    window.location.href = "/login";
  };

  if (!isOpen) return null;

  // Format remaining seconds into MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl p-6 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Pulsing Alert Icon */}
        <div className="flex justify-center mb-5">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-20 animate-ping" />
            <Clock className="w-8 h-8 relative z-10" />
          </div>
        </div>

        {/* Dialog Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Session Expiring Soon
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            For security, your session will time out soon. Keep your session active to avoid losing unsaved changes.
          </p>
        </div>

        {/* Countdown display */}
        <div className="flex flex-col items-center justify-center p-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50">
          <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
            Time Remaining
          </span>
          <span className="text-4xl font-mono font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {formattedTime}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800 font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
          
          <button
            onClick={handleExtendSession}
            disabled={isRefreshing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold text-sm shadow-lg shadow-blue-500/20 dark:shadow-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Extend Session
          </button>
        </div>

      </div>
    </div>
  );
}
