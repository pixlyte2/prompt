/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        buffer: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Real Buffer (publish.buffer.com) brand blue. 500 = "Buffer Blue" #2C4BFF,
        // 400 = Buffer periwinkle #6B81FF, 900 = Buffer navy #121E66.
        primary: {
          50: '#eef1ff',
          100: '#e0e5ff',
          200: '#c6ceff',
          300: '#a3b0ff',
          400: '#6b81ff',
          500: '#2c4bff',
          600: '#1f3ae6',
          700: '#1a30bf',
          800: '#182a9c',
          900: '#121e66',
        }
      },
      fontFamily: {
        'sans': ['Figtree', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'buffer': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'buffer-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
