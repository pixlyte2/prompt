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
        "Admin accounts use this full console; content managers, viewers, and Voice Over users sign in at the same login and only see their allowed areas.",
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
        "Run context-aware generation with your saved prompts and source material.",
        "Sessions can be restored from the Dashboard activity list or the top bar history (clock).",
        "Shift+Enter for a new line; Enter sends when appropriate for the active field.",
      ],
    },
    {
      title: "Trending Hub",
      icon: TrendingUp,
      color: "text-pink-500",
      items: [
        "Competitor watch: pick a category (type), channel, time window (4h, 8h, 12h, 24h, 7d, or All), minimum views, search, and sort (trending / views / latest).",
        "Configure categories and YouTube sources from the settings entry in the category menu.",
        "Add a video to Production Hub with Schedule / backlog, platform, format, assignees, optional notes, and optional script.",
      ],
    },
    {
      title: "Production Hub",
      icon: LayoutDashboard,
      color: "text-blue-500",
      items: [
        "Board for video tasks: scheduled dates, backlog, assignees, Long/Short format pills, platform, notes, script, and optional voice-over audio.",
        "Create and edit tasks, move work through your team’s pipeline alongside the Dashboard Delivery Monitor.",
      ],
    },
    {
      title: "Voice-over",
      icon: Mic,
      color: "text-emerald-600",
      items: [
        "Lists scheduled Production Hub tasks by date (same as the schedule board).",
        "Users with the Voice Over role only see this screen after login (no other admin pages or assistant).",
        "Voice-over audio is stored in MongoDB (GridFS). View script in a modal, download it as .txt, upload or replace the file (common audio formats), download the audio, or remove it.",
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
          YouTube inspector, and Help. Collapse the sidebar with the chevron on its edge; the choice is remembered on this device.
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
              <span>Production Hub uses Long/Short pills and backlog mode; Trending Hub can push the same video onto the board in one flow.</span>
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
