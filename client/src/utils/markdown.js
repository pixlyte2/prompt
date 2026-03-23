export function renderMarkdown(text, isDarkMode = false) {
  if (!text) return "";
  
  const textColor = isDarkMode ? '#ffffff' : '#374151';
  const headingColor = isDarkMode ? '#ffffff' : '#111827';
  const strongColor = isDarkMode ? '#ffffff' : '#111827';
  const codeColor = isDarkMode ? '#ffffff' : '#dc2626';
  const codeBg = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';
  
  return text
    .replace(/```([\s\S]*?)```/g, `<pre style="background:#1f2937;color:#f9fafb;padding:1rem;border-radius:0.5rem;overflow-x:auto;margin:0.75rem 0;font-family:monospace;font-size:0.8rem;border:1px solid #374151"><code>$1</code></pre>`)
    .replace(/^#### (.+)$/gm, `<h4 style="font-size:1rem;font-weight:700;margin:1.25rem 0 0.5rem;color:${headingColor};padding-bottom:0.375rem;border-bottom:1px solid ${borderColor}">$1</h4>`)
    .replace(/^### (.+)$/gm, `<h3 style="font-size:1.125rem;font-weight:700;margin:1.5rem 0 0.625rem;color:${headingColor};padding-bottom:0.375rem;border-bottom:1px solid ${borderColor}">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="font-size:1.25rem;font-weight:700;margin:1.75rem 0 0.75rem;color:${headingColor};padding-bottom:0.5rem;border-bottom:2px solid #3b82f6">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="font-size:1.5rem;font-weight:800;margin:1.75rem 0 0.875rem;color:${headingColor}">$1</h1>`)
    .replace(/^---$/gm, `<hr style="border:none;border-top:1px solid ${borderColor};margin:1.25rem 0"/>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700;color:${strongColor}">$1</strong>`)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li style="margin-left:1.25rem;margin-bottom:0.375rem;list-style-type:disc">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1.25rem;margin-bottom:0.375rem;list-style-type:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1.25rem;margin-bottom:0.375rem;list-style-type:decimal">$1</li>')
    .replace(/`([^`]+)`/g, `<code style="background:${codeBg};padding:0.125rem 0.375rem;border-radius:0.25rem;font-family:monospace;font-size:0.85em;color:${codeColor}">$1</code>`)
    .split("\n\n")
    .map(p => {
      p = p.trim();
      if (!p || p.startsWith("<h") || p.startsWith("<pre") || p.startsWith("<hr") || p.startsWith("<li")) return p;
      return `<p style="margin-bottom:0.75rem;line-height:1.7;color:${textColor}">${p}</p>`;
    })
    .join("")
    .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (m) => {
      const tag = m.includes("list-style-type:decimal") ? "ol" : "ul";
      return `<${tag} style="margin:0.75rem 0;padding-left:0.5rem">${m}</${tag}>`;
    });
}
