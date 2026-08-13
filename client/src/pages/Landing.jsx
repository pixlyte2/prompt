import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, useReducedMotion, animate } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clapperboard,
  Facebook,
  Github,
  Instagram,
  LayoutDashboard,
  LineChart,
  Linkedin,
  Menu,
  Mic,
  MessageSquare,
  Moon,
  PenTool,
  Play,
  Quote,
  Rocket,
  Search,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Twitter,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import CreatorAILogo from "../components/CreatorAILogo";

const EASE_PREMIUM = [0.23, 1, 0.32, 1];

const MDiv = motion.div;

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "workflow", label: "Workflow" },
  { id: "platforms", label: "Platforms" },
  { id: "testimonials", label: "Customers" },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Competitor Watch",
    caption: "Analyze YouTube competitors and schedule automated insights with Get Script AI.",
    accent: "from-rose-500/20 to-rose-500/0 text-rose-500",
  },
  {
    icon: Youtube,
    title: "Video Inspector",
    caption: "Inspect metadata, stats, and performance signals for any YouTube video in seconds.",
    accent: "from-red-500/20 to-red-500/0 text-red-500",
  },
  {
    icon: LineChart,
    title: "Analytics & Channel Compare",
    caption: "Compare 10–500 channels side by side and see what actually moves the needle.",
    accent: "from-primary-500/20 to-primary-500/0 text-primary-500",
  },
  {
    icon: LayoutDashboard,
    title: "Production Hub",
    caption: "A shared task board with assignee filters and one-click content creation.",
    accent: "from-indigo-500/20 to-indigo-500/0 text-indigo-500",
  },
  {
    icon: Mic,
    title: "Voice-over Studio",
    caption: "Schedule voice-over tasks and level up your team with the VO Training library.",
    accent: "from-purple-500/20 to-purple-500/0 text-purple-500",
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    caption: "Generate prompts, browse completed scripts, and protect brand tone with Content Guard.",
    accent: "from-emerald-500/20 to-emerald-500/0 text-emerald-500",
  },
];

const PLATFORMS = [
  {
    icon: Youtube,
    name: "YouTube",
    color: "#EF4444",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-500",
    ring: "ring-red-500/20",
    stat: "60+ hours uploaded every minute",
    bullets: ["Video Inspector & metadata", "Channel compare analytics", "Competitor Watch scheduling"],
  },
  {
    icon: Instagram,
    name: "Instagram",
    color: "#EC4899",
    bg: "bg-pink-50 dark:bg-pink-500/10",
    text: "text-pink-500",
    ring: "ring-pink-500/20",
    stat: "2 billion monthly active users",
    bullets: ["Reels-first content planning", "Short-form prompt packs", "Hashtag & trend insights"],
  },
  {
    icon: Facebook,
    name: "Facebook",
    color: "#2563EB",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-500",
    ring: "ring-blue-500/20",
    stat: "3 billion monthly active users",
    bullets: ["Cross-posting workflows", "Audience analytics", "Unified team scheduling"],
  },
];

const WORKFLOW = [
  {
    icon: Search,
    step: "01",
    title: "Research",
    caption: "Watch competitors, inspect trending videos, and surface topics worth your time.",
  },
  {
    icon: PenTool,
    step: "02",
    title: "Create",
    caption: "Draft scripts and prompts with AI assistance, guarded to match your brand voice.",
  },
  {
    icon: Clapperboard,
    step: "03",
    title: "Produce",
    caption: "Assign tasks on the Production Hub, schedule recordings, and queue voice-over work.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Ship & measure",
    caption: "Publish across platforms and review analytics that feed your next round of content.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aarav Menon",
    role: "Admin · Production Lead",
    quote:
      "We replaced a dozen scattered sheets with one pipeline. Competitor Watch alone saves me hours every single week.",
    initials: "AM",
    tint: "bg-primary-500",
  },
  {
    name: "Divya Ramesh",
    role: "Content Manager",
    quote:
      "The AI prompts are unreal. Scripts that used to take a full day now get drafted in minutes — and they sound on-brand.",
    initials: "DR",
    tint: "bg-pink-500",
  },
  {
    name: "Karthik Subramani",
    role: "Voice-over Lead",
    quote:
      "Scheduling VO tasks from the same board as the writers finally ended our deadline chaos. Total game changer.",
    initials: "KS",
    tint: "bg-emerald-500",
  },
];

const MARQUEE_ITEMS = [
  "Competitor Watch",
  "Video Inspector",
  "Channel Compare",
  "Production Hub",
  "Voice-over Studio",
  "AI Chat",
  "Content Guard",
  "Script Library",
  "Analytics",
];

const STATS = [
  { value: 3, suffix: "", label: "Platforms supported" },
  { value: 6, suffix: "", label: "Production modules" },
  { value: 500, suffix: "+", label: "Channel compare samples" },
  { value: 5, suffix: "", label: "Team roles, one workspace" },
];

function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: reduceMotion ? 0 : 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduceMotion]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const reduceMotion = useReducedMotion();
  return (
    <MDiv
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, ease: EASE_PREMIUM, delay }}
    >
      {children}
    </MDiv>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <Reveal className="max-w-2xl mx-auto text-center mb-14 lg:mb-16">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 dark:border-primary-400/20 bg-primary-50 dark:bg-primary-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-primary-600 dark:text-primary-300 uppercase">
        <Sparkles size={12} aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

function Navbar({ isDark, toggleDarkMode }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  const textColor = scrolled ? "text-slate-700 dark:text-slate-200" : "text-white/80";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[4.5rem] flex items-center justify-between gap-4">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}
          className="flex items-center gap-3"
          aria-label="Creator AI home"
        >
          <CreatorAILogo size="md" variant={scrolled ? "gradient" : "glass"} />
          <span
            className={`text-xl font-bold tracking-tight ${
              scrolled ? "text-slate-900 dark:text-white" : "text-white"
            }`}
          >
            Creator AI
          </span>
        </a>

        <div className={`hidden lg:flex items-center gap-8 text-sm font-medium ${textColor}`}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              scrolled
                ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/login"
            className={`hidden sm:inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              scrolled
                ? "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Sign in
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30 transition-colors"
          >
            Get started
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`lg:hidden p-2.5 rounded-xl border transition-colors ${
              scrolled
                ? "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                : "border-white/20 bg-white/10 text-white"
            }`}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <MDiv
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            className="lg:hidden overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollTo(link.id)}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/login"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                Sign in to workspace
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </MDiv>
        )}
      </AnimatePresence>
    </header>
  );
}

function ChartBars() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const heights = [42, 68, 55, 82, 64, 92, 74, 100, 58, 88, 70, 96];

  return (
    <div ref={ref} className="flex items-end gap-2 h-24">
      {heights.map((h, i) => (
        <MDiv
          key={i}
          className="flex-1 rounded-t-md bg-gradient-to-t from-primary-500 to-blue-400"
          initial={reduceMotion ? { height: `${h}%` } : { height: "10%" }}
          animate={inView ? { height: `${h}%` } : {}}
          transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: EASE_PREMIUM }}
        />
      ))}
    </div>
  );
}

function DashboardMockup() {
  const reduceMotion = useReducedMotion();
  return (
    <MDiv
      initial={reduceMotion ? false : { opacity: 0, y: 64, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.35 }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-primary-500/25 blur-3xl" aria-hidden="true" />
      <div className="absolute -top-8 right-16 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl animate-float" aria-hidden="true" />

      <div className="relative rounded-2xl border border-white/15 bg-white/10 dark:bg-slate-900/50 backdrop-blur-2xl shadow-2xl shadow-primary-900/40 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
          <span className="w-3 h-3 rounded-full bg-red-400/80" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" aria-hidden="true" />
          <div className="ml-3 flex-1 max-w-xs mx-auto h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-medium text-white/50">
            app.creatorai.work · Production Hub
          </div>
        </div>

        <div className="flex">
          <div className="hidden sm:flex flex-col gap-1.5 p-3 w-40 border-r border-white/10">
            {[
              { icon: LayoutDashboard, label: "Production Hub" },
              { icon: LineChart, label: "Analytics" },
              { icon: TrendingUp, label: "Competitor Watch" },
              { icon: Mic, label: "Voice-over" },
              { icon: MessageSquare, label: "AI Chat" },
            ].map(({ icon, label }, i) => {
              const Icon = icon;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-medium ${
                    i === 0
                      ? "bg-primary-500 text-white shadow-md shadow-primary-500/40"
                      : "text-white/60"
                  }`}
                >
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </div>
              );
            })}
          </div>

          <div className="flex-1 p-4 sm:p-5 space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                  This week
                </p>
                <p className="text-sm font-bold text-white">Content production</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                <Zap size={11} aria-hidden="true" />
                On track
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Published", value: "24", tint: "text-emerald-300" },
                { label: "In progress", value: "11", tint: "text-blue-300" },
                { label: "Scripts", value: "9", tint: "text-amber-300" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <p className={`text-lg font-black ${s.tint}`}>{s.value}</p>
                  <p className="text-[10px] text-white/45 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                  Views · last 12 posts
                </p>
                <p className="text-[10px] font-semibold text-emerald-300">+12.4%</p>
              </div>
              <ChartBars />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 sm:-left-8 top-1/3 animate-float">
        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3.5 py-2.5 shadow-xl shadow-slate-900/20">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Script generated</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">AI · 3 new drafts ready</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 sm:-right-8 bottom-1/3 animate-float-slow">
        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3.5 py-2.5 shadow-xl shadow-slate-900/20">
          <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-500">
            <TrendingUp size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Channel Compare</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">500 samples · synced</p>
          </div>
        </div>
      </div>
    </MDiv>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-primary-900 dark:bg-primary-800">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-800 to-slate-950 dark:from-blue-500 dark:via-primary-600 dark:to-primary-900" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950 dark:from-slate-950/20 dark:via-transparent dark:to-primary-900" aria-hidden="true" />
      <div className="absolute inset-0 landing-grid-bg opacity-50" aria-hidden="true" />

      <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-primary-400/25 blur-3xl animate-float" aria-hidden="true" />
      <div className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-blue-500/20 blur-3xl animate-float-slow" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full border border-white/5" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full border border-white/5" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
          <div>
            <MDiv
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Content Production OS · Voice-over studio & AI Chat
            </MDiv>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.1 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl font-black tracking-tight text-white leading-[1.05]"
            >
              Run your entire{" "}
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 animate-gradient-pan bg-clip-text text-transparent">
                content production
              </span>{" "}
              on autopilot
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-blue-100/85 leading-relaxed max-w-xl"
            >
              Creator AI unifies competitor research, YouTube analytics, AI-assisted scripting,
              task management, and voice-over scheduling — so your team ships more, faster.
            </motion.p>

            <MDiv
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-3.5"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 shadow-xl shadow-primary-900/30 hover:bg-blue-50 transition-colors"
              >
                Get started free
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("workflow");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Play size={12} className="fill-white text-white" aria-hidden="true" />
                </span>
                See how it works
              </button>
            </MDiv>

            <motion.ul
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.4 }}
              className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5"
            >
              {[
                "AI-powered scripts",
                "Multi-platform scheduling",
                "Team collaboration",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-100/90">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    <Check size={11} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="lg:pl-4">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className="relative z-20 -mt-14 px-4 sm:px-6 lg:px-8">
      <Reveal className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200/70 dark:divide-slate-800 overflow-hidden">
          {STATS.map((stat, i) => (
            <div key={stat.label} className={`px-6 py-7 ${i % 2 === 1 ? "border-l border-slate-200/70 dark:border-slate-800 lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`}>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-primary-600 dark:text-primary-400">
                <Counter to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function PlatformStrip() {
  return (
    <section className="py-14 lg:py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500">
            One pipeline for every part of production
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 marquee-mask overflow-hidden">
          <div className="flex w-max animate-marquee gap-4">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div
                key={`${item}-${i}`}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
              >
                <Sparkles size={14} className="text-primary-500" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Features"
          title="Everything your content team needs, in one place"
          subtitle="Six production modules that plug into a single workflow — from research to shipping."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map(({ icon, title, caption, accent }, i) => {
            const Icon = icon;
            return (
              <Reveal key={title} delay={(i % 3) * 0.08}>
                <div className="group relative h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300">
                  <div
                    className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${accent.split(" text")[0]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    aria-hidden="true"
                  />
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} ring-1 ring-inset ring-slate-900/5 dark:ring-white/10`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {caption}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Platforms() {
  return (
    <section id="platforms" className="py-20 lg:py-28 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Platforms"
          title="Built for the platforms your audience lives on"
          subtitle="Manage publishing, analytics, and assets across every major channel from one dashboard."
        />

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {PLATFORMS.map(({ icon, name, bg, text, ring, stat, bullets }, i) => {
            const Icon = icon;
            return (
              <Reveal key={name} delay={i * 0.1}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl bg-gradient-to-br from-slate-200/70 to-transparent dark:from-slate-800/60" aria-hidden="true" />
                  <div className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg} ring-1 ${ring}`}>
                    <Icon size={22} className={text} aria-hidden="true" />
                  </div>
                  <h3 className="relative mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {name}
                  </h3>
                  <p className="relative mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {stat}
                  </p>
                  <ul className="relative mt-5 space-y-2.5">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={16} className={`${text} shrink-0 mt-0.5`} aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="relative py-20 lg:py-28 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800/40 via-slate-950 to-slate-950" aria-hidden="true" />
      <div className="absolute -top-32 right-0 w-[28rem] h-[28rem] rounded-full bg-primary-500/15 blur-3xl animate-float-slow" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-blue-500/10 blur-3xl animate-float" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mx-auto text-center mb-14 lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-100 uppercase">
            <Zap size={12} aria-hidden="true" />
            Workflow
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-tight">
            From idea to published, in four steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-blue-100/70 leading-relaxed">
            A production pipeline that keeps every asset, task, and teammate on the same page.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {WORKFLOW.map(({ icon, step, title, caption }, i) => {
            const Icon = icon;
            return (
              <Reveal key={step} delay={i * 0.1}>
                <div className="relative group h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
                  <span className="absolute top-5 right-6 text-4xl font-black text-white/10 transition-colors group-hover:text-primary-400/30">
                    {step}
                  </span>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/40">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{caption}</p>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight
                      size={16}
                      className="absolute -right-3.5 top-1/2 -translate-y-1/2 hidden lg:block text-primary-400/60"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Customers"
          title="Loved by teams who ship content daily"
          subtitle="From admins to voice-over leads — hear how teams run production with Creator AI."
        />

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <div className="relative flex h-full flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300">
                <Quote size={28} className="text-primary-200 dark:text-primary-500/40" aria-hidden="true" />
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  “{t.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.tint} text-xs font-bold text-white`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section id="cta" className="py-20 lg:py-28 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 animate-gradient-pan px-6 py-14 sm:px-12 lg:px-16 lg:py-20 text-center shadow-2xl shadow-primary-500/25">
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-float" aria-hidden="true" />
            <div className="absolute -bottom-28 -right-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl animate-float-slow" aria-hidden="true" />
            <div className="absolute inset-0 landing-grid-bg opacity-40" aria-hidden="true" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100">
                <Sparkles size={12} aria-hidden="true" />
                Get started today
              </span>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Ready to put your content production on autopilot?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-blue-100/85 leading-relaxed">
                Join your team in the workspace and turn scattered workflows into one
                unstoppable content machine.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3.5">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-primary-700 shadow-xl shadow-primary-900/30 hover:bg-blue-50 transition-colors"
                >
                  Get started free
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-colors"
                >
                  Sign in to workspace
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const reduceMotion = useReducedMotion();
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", action: () => scrollTo("features") },
        { label: "Workflow", action: () => scrollTo("workflow") },
        { label: "Platforms", action: () => scrollTo("platforms") },
        { label: "Customers", action: () => scrollTo("testimonials") },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "System Status", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ];

  const socials = [
    { icon: Twitter, label: "Twitter" },
    { icon: Youtube, label: "YouTube" },
    { icon: Instagram, label: "Instagram" },
    { icon: Linkedin, label: "LinkedIn" },
    { icon: Github, label: "GitHub" },
  ];

  return (
    <footer className="bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid gap-10 lg:gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
              }}
              className="flex items-center gap-3"
              aria-label="Creator AI home"
            >
              <CreatorAILogo size="md" variant="glass" />
              <span className="text-xl font-bold tracking-tight text-white">Creator AI</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The content production OS that unifies research, creation, scheduling, and
              analytics for modern creator teams.
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map(({ icon, label }) => {
                const Icon = icon;
                return (
                  <a
                    key={label}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-primary-500 hover:border-primary-500 transition-colors"
                    aria-label={label}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.action ? (
                      <button
                        type="button"
                        onClick={link.action}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Creator AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased">
      <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main>
        <Hero />
        <StatsStrip />
        <PlatformStrip />
        <Features />
        <Platforms />
        <Workflow />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
