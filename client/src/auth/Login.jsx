import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoginScene from "../components/LoginScene";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      toast.success("Login successful");

      if (res.data.role === "admin") navigate("/admin");
      if (res.data.role === "content_manager") navigate("/content/prompts");
      if (res.data.role === "viewer") navigate("/viewer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

     <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-black via-indigo-900 to-black overflow-hidden">

  {/* Neon AI Network */}
  <div className="absolute inset-0">
    <LoginScene />
  </div>

  {/* Cyberpunk Text Overlay */}
  <div className="relative z-10 text-cyan-400 p-12 flex flex-col justify-center">
    <h1 className="text-4xl font-bold mb-6 tracking-wider">
      CreatorAI
    </h1>
    <p className="text-lg opacity-90 max-w-md leading-relaxed text-pink-400">
      Manage prompts, users, and content seamlessly with our powerful AI-driven dashboard.
    </p>
  </div>
</div>


    {/* RIGHT SIDE LOGIN CARD */}
<div className="relative flex w-full md:w-1/2 items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200">

  {/* Background Glow Effects */}
  <div className="absolute w-72 h-72 bg-blue-400/20 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
  <div className="absolute w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl bottom-10 right-10 animate-pulse"></div>

  {/* Glass Login Card */}
  <form
    onSubmit={handleLogin}
    className="relative z-10 backdrop-blur-xl bg-white/70 border border-white/40 w-full max-w-md p-10 rounded-3xl shadow-2xl transition-all duration-500"
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-2">
      Welcome Back
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Please enter your credentials to continue
    </p>

    {/* Email */}
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Email Address
      </label>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    {/* Password */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Password
      </label>
      <input
        type="password"
        placeholder="Enter your password"
        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    {/* Login Button */}
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 flex items-center justify-center shadow-lg"
    >
      {loading ? (
        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      ) : (
        "Sign In"
      )}
    </button>

    <p className="text-xs text-gray-500 text-center mt-6">
      © 2026 CreatorAI. All rights reserved.
    </p>
  </form>
</div>

    </div>
  );
}
