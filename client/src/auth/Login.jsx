import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", JSON.stringify({ name: res.data.name || email.split('@')[0], email }));

      toast.dismiss();
      toast.success("Welcome back!");

      setTimeout(() => {
        if (res.data.role === "admin") navigate("/admin");
        if (res.data.role === "content_manager") navigate("/content/prompts");
        if (res.data.role === "viewer") navigate("/viewer");
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 dark:bg-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">CreatorAI</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Welcome to the future of
              <span className="block text-blue-200">AI-powered creativity</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Streamline your workflow with intelligent prompts and automated content generation.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-sm">Smart prompt management</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-sm">AI-powered content generation</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-sm">Team collaboration tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">CreatorAI</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors duration-200 ${
                    focusedField === 'email' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </div>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 ${
                    focusedField === 'email'
                      ? 'border-blue-600 dark:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors duration-200 ${
                    focusedField === 'password' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 ${
                    focusedField === 'password'
                      ? 'border-blue-600 dark:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2024 CreatorAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
