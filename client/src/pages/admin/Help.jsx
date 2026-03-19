import { HelpCircle, Users, Layers, Tag, FileText, MessageSquare, Copy, Eye } from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";

export default function Help() {
  const sections = [
    {
      title: "Dashboard",
      icon: HelpCircle,
      color: "text-gray-600",
      items: [
        "View system statistics and quick actions",
        "Access recent prompts with preview and copy",
        "Navigate to different sections quickly"
      ]
    },
    {
      title: "Users",
      icon: Users,
      color: "text-blue-600",
      items: [
        "Create new users with name, email, and password",
        "Assign roles: Viewer or Content Manager",
        "Delete users when needed"
      ]
    },
    {
      title: "Channels",
      icon: Layers,
      color: "text-purple-600",
      items: [
        "Create channels to organize content",
        "Edit channel names",
        "Delete unused channels"
      ]
    },
    {
      title: "Prompt Types",
      icon: Tag,
      color: "text-orange-600",
      items: [
        "Create prompt types under specific channels",
        "Edit type names",
        "Delete prompt types"
      ]
    },
    {
      title: "Prompts",
      icon: FileText,
      color: "text-indigo-600",
      items: [
        "Create prompts with channel, type, and AI model",
        "Preview prompts with eye icon",
        "Copy prompts to clipboard",
        "Edit and delete prompts",
        "Export selected prompts as JSON",
        "Search and filter by channel/type"
      ]
    },
    {
      title: "AI Chat",
      icon: MessageSquare,
      color: "text-emerald-600",
      items: [
        "Select a prompt from dropdown",
        "Add source material (YouTube URL, script, etc.)",
        "Chat with AI using selected prompt context",
        "Press Enter to send, Shift+Enter for new line"
      ]
    }
  ];

  return (
    <AdminLayout 
      title="Help & Guide" 
      titleInfo="Complete guide to manage prompts and AI interactions"
      icon={HelpCircle}
    >
      <div className="buffer-card overflow-hidden p-4">

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

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
            <Copy className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Use <Eye className="inline w-4 h-4" /> icon to preview prompts before copying</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Recent prompts are cached for quick access</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Clear cache button refreshes all data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Export prompts as JSON for backup</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
