import {
  HelpCircle,
  Users,
  FileText,
  MessageSquare,
  Copy,
  LayoutDashboard,
  TrendingUp,
  MousePointer2,
  BarChart3,
  Mic,
  Youtube,
  LineChart,
  Menu,
  Database,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";

export default function Help() {
  const sections = [
    {
      title: "Dashboard",
      icon: BarChart3,
      color: "text-gray-600",
      items: [
        "Overview: tap the stat tiles for Prompts, Users, or Prompt Types (counts come from the server).",
        "Channels are managed under Prompts → Channels (same data as the Channels count).",
        "Delivery Monitor: today’s scheduled video tasks grouped by assignee (Pooja, Mahalakshmi), with workload-style counts.",
        "Recent AI Chat activity: resume a session from a row, or open full history from the top bar clock icon.",
      ],
    },
    {
      title: "Users",
      icon: Users,
      color: "text-blue-600",
      items: [
        "Invite and manage team accounts from the Users screen.",
        "Roles: Admin (full console), Content Manager and Viewer (their own prompt libraries), Voice Over (Voice-over Schedule tab only), and Voice Over Training (VO Training tab only).",
        "Assign roles when adding or editing a user; limited roles use the same login page and only see their allowed areas.",
      ],
    },
    {
      title: "Prompts (library)",
      icon: FileText,
      color: "text-indigo-600",
      items: [
        "Three tabs: Prompts, Prompt Types, and Channels—switch tabs at the top of Prompt Management.",
        "Build and edit prompts, assign channels and types, and preview before use where supported.",
        "Filtering and lists match the live Prompt Manager, Channel Manager, and Prompt Type Manager behavior.",
      ],
    },
    {
      title: "AI Chat",
      icon: MessageSquare,
      color: "text-emerald-600",
      items: [
        "Tabs: AI Chat, Completed Scripts, Content Guard, and Settings (API key for Gemini).",
        "Run context-aware generation with saved prompts and source material; paste a YouTube URL to fetch captions into source.",
        "Sessions restore from the Dashboard activity list or the top bar history (clock). Shift+Enter for a new line.",
      ],
    },
    {
      title: "Trending Hub",
      icon: TrendingUp,
      color: "text-pink-500",
      items: [
        "Competitor Watch: filter by category (type), channel, time window (4h–7d or All), minimum views, Long/Short format, search, and sort (trending / views / latest).",
        "Competitor settings: per-channel Long/Shorts format, videos per channel (1–500), and reorder types with the up/down arrows.",
        "Schedule from a video card: set date or backlog, platform, format, assignees, notes, and script—with a live word count.",
        "Get Script opens Video AI to generate from captions; target video length and prompt choice are remembered on this device.",
      ],
    },
    {
      title: "Production Hub",
      icon: LayoutDashboard,
      color: "text-blue-500",
      items: [
        "Task board grouped by scheduled date (plus backlog): Long/Short pills, platform, notes, script, and optional voice-over audio.",
        "Each date group has assignee filter pills (Pooja, Mahalakshmi, Unassigned) with Long/Short counts—click to filter tasks in that group.",
        "Tasks with a script show a word-count pill (e.g. 450w). Use Add Content to create or edit tasks, or push from Trending Hub Schedule.",
      ],
    },
    {
      title: "Voice-over",
      icon: Mic,
      color: "text-emerald-600",
      items: [
        "Two tabs: Schedule (Production Hub tasks by date) and VO Training (last 10 completed videos with script and voice-over attached).",
        "Schedule: view script, download .txt, upload/replace/download/remove voice-over audio (stored in MongoDB GridFS).",
        "VO Training: browse recent completed work and download script or voice-over files for reference.",
        "voice_over role sees Schedule only; voice_over_training sees VO Training only; Admin sees both tabs.",
      ],
    },
    {
      title: "YouTube Analytics",
      icon: LineChart,
      color: "text-red-500",
      items: [
        "Analytics tab: pick a tracked channel, toggle Long/Shorts (or use the channel default from Competitor settings)—changing format auto-scrapes.",
        "Sample size pills (10, 50, 100, 200, 500): clicking a size re-scrapes that many newest uploads for KPIs and charts.",
        "Channel avatars and subscriber counts come from the database and refresh on scrape.",
        "Channel Compare tab: pick two channels (selection saved on this device), compare KPIs side-by-side, and view a dual-line uploads chart.",
        "Compare has its own Long/Short toggle and sample size; changing sample size auto-scrapes both channels.",
      ],
    },
    {
      title: "YouTube Video Inspector",
      icon: Youtube,
      color: "text-red-600",
      items: [
        "Paste a watch URL, Shorts link, youtu.be link, or 11-character video ID, then Analyze (long timeout for slow fetches).",
        "Shows thumbnails, stats, channel block, metadata, description, and tags when the API returns them; clear or paste from clipboard using the bar actions.",
      ],
    },
  ];

  return (
    <AdminLayout
      title="Help & Guide"
      titleInfo="What each admin screen does and how it fits together"
      icon={HelpCircle}
    >
      <div className="buffer-card overflow-y-auto p-4 custom-scrollbar">

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
          The left sidebar matches this order: Dashboard, Users, Prompts, AI Chat, Trending Hub, Production Hub, Voice-over,
          YouTube Analytics, and Help. Collapse the sidebar with the chevron on its edge; the choice is remembered on this device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="buffer-card p-3 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
            <Copy className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Quick tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>
                <Menu className="inline w-4 h-4 align-text-bottom" /> Mobile: open the full menu from the top bar; <MousePointer2 className="inline w-4 h-4 align-text-bottom" /> on desktop use the sidebar chevron to widen the canvas.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Trending Hub Schedule and Production Hub Add Content share the same task fields; YouTube Analytics compare channels persist on this device.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Dark mode and sidebar collapsed state persist while you move between pages.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>
                <Database className="inline w-4 h-4 align-text-bottom" /> Top bar Clear: wipes cached prompt data and local AI chat history after you confirm. The user avatar menu is for logout only.
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Content managers and viewers use separate routes after login (their own prompt libraries only). Super admin uses the dedicated super admin login and console, not this admin sidebar.
        </p>
      </div>
    </AdminLayout>
  );
}
