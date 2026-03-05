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
    <AdminLayout title="Help & Guide">
      <div className="bg-gray-50 p-4">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 text-white shadow-lg mb-4">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle size={32} />
            <h1 className="text-3xl font-bold">How to Use CreatorAI</h1>
          </div>
          <p className="text-cyan-100">Complete guide to manage prompts and AI interactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-cyan-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border p-4 mt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Copy className="w-5 h-5 text-cyan-600" />
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-cyan-600">✓</span>
              <span>Use <Eye className="inline w-4 h-4" /> icon to preview prompts before copying</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600">✓</span>
              <span>Recent prompts are cached for quick access</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600">✓</span>
              <span>Clear cache button refreshes all data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600">✓</span>
              <span>Export prompts as JSON for backup</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
