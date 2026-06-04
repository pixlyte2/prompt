import { useState, useId, Suspense, lazy } from "react";
import api, { saveAuth } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  Moon,
  Sun,
  AlertCircle,
  TrendingUp,
  Youtube,
  LineChart,
  LayoutDashboard,
  MessageSquare,
  Mic,
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";

const LoginScene = lazy(() => import("../components/LoginScene"));

const ROLE_HOME = {
  admin: "/admin",
  content_manager: "/content/prompts",
  viewer: "/viewer",
  voice_over: "/admin/voice-over",
};

/** Labels aligned with AdminLayout, TrendingHub, Help, and YouTubeAnalytics */
const BRAND_FEATURES = [
  {
    icon: TrendingUp,
    label: "YouTube competitor analysis",
    caption: "Trending Hub · Competitor Watch",
  },
  {
    icon: Youtube,
    label: "YouTube video analysis",
    caption: "YouTube Video Inspector",
  },
  {
    icon: LineChart,
    label: "YouTube Analytics",
    caption: "Channel metrics & video performance",
  },
  {
    icon: LayoutDashboard,
    label: "Production Hub",
    caption: "Schedule tasks, scripts & delivery",
  },
  {
    icon: Mic,
    label: "Voice-over",
    caption: "Upload & manage task audio",
  },
  {
    icon: MessageSquare,
    label: "AI Chat",
    caption: "Completed Scripts & Content Guard",
  },
];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useDarkMode();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const formErrorId = `${formId}-form-error`;

  const validateFields = (values = { email, password }) => {
    const next = { email: "", password: "" };
    if (!values.email.trim()) {
      next.email = "Email is required";
    } else if (!isValidEmail(values.email)) {
      next.email = "Enter a valid email address";
    }
    if (!values.password.trim()) {
      next.password = "Password is required";
    }
    setFieldErrors(next);
    return !next.email && !next.password;
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validateFields();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    setTouched({ email: true, password: true });

    if (!validateFields()) return;

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email: email.trim(), password });

      saveAuth(res.data.token, res.data.role, {
        name: res.data.name || email.split("@")[0],
        email: email.trim(),
      });

      toast.dismiss();
      toast.success("Welcome back!");

      const home = ROLE_HOME[res.data.role];
      if (home) {
        setTimeout(() => navigate(home), 400);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const showEmailError = touched.email && fieldErrors.email;
  const showPasswordError = touched.password && fieldErrors.password;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Brand panel — desktop */}
      <aside
        className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="h-full w-full bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900" />
            }
          >
            <LoginScene />
          </Suspense>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/85 to-slate-900/90" />
        <div className="absolute top-24 left-16 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-32 right-12 w-56 h-56 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white max-w-xl">
          <div className="inline-flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl ring-1 ring-white/10">
              <Sparkles className="w-8 h-8" aria-hidden="true" />
            </div>
            <span className="text-3xl xl:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              Creator AI
            </span>
          </div>
          <h1 className="text-2xl xl:text-3xl font-bold leading-tight tracking-tight">
            Welcome to the future of
            <span className="block text-blue-200 mt-1">AI-powered creativity</span>
          </h1>
          <p className="mt-4 text-base text-blue-100/90 leading-relaxed">
            Research competitors, inspect any YouTube video, track channel analytics, and
            run production—from prompts to voice-over—in one workspace.
          </p>
          <ul className="mt-10 space-y-4" aria-label="Product capabilities">
            {BRAND_FEATURES.map(({ icon: Icon, label, caption }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-blue-100" aria-hidden="true" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white leading-snug">{label}</p>
                  <p className="text-xs text-blue-200/80 mt-0.5 leading-relaxed">{caption}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col min-h-0">
        <header className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 shrink-0">
          <div className="lg:hidden inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md ring-2 ring-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Creator AI
            </span>
          </div>
          <div className="lg:ml-auto" />
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <div className="buffer-card p-6 sm:p-8 shadow-md">
              {formError && (
                <div
                  id={formErrorId}
                  role="alert"
                  className="mb-5 flex gap-2.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
                noValidate
                aria-describedby={formError ? formErrorId : undefined}
              >
                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email address <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@company.com"
                      className={`buffer-input text-sm pl-10 ${
                        showEmailError
                          ? "border-red-400 dark:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formError) setFormError("");
                      }}
                      onBlur={() => handleBlur("email")}
                      disabled={loading}
                      aria-invalid={showEmailError ? "true" : "false"}
                      aria-describedby={showEmailError ? `${emailId}-error` : undefined}
                      required
                    />
                  </div>
                  {showEmailError && (
                    <p
                      id={`${emailId}-error`}
                      role="alert"
                      className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={passwordId}
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Password <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id={passwordId}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`buffer-input text-sm pl-10 pr-11 ${
                        showPasswordError
                          ? "border-red-400 dark:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError("");
                      }}
                      onBlur={() => handleBlur("password")}
                      disabled={loading}
                      aria-invalid={showPasswordError ? "true" : "false"}
                      aria-describedby={
                        showPasswordError ? `${passwordId}-error` : undefined
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showPasswordError && (
                    <p
                      id={`${passwordId}-error`}
                      role="alert"
                      className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="buffer-button-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Super admin?{" "}
              <Link
                to="/superadmin-login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Sign in here
              </Link>
            </p>

            <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                © {new Date().getFullYear()} Pixlyt Digital Solutions Pvt Ltd. All rights
                reserved.
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
