import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="text-center max-w-md"
      >
        <h1 className="text-[8rem] font-black leading-none bg-gradient-to-br from-primary-500 to-blue-600 bg-clip-text text-transparent">
          404
        </h1>
        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          Page not found
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30 transition-colors"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
