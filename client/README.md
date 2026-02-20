# CreatorAI Client

## About
A React-based web application for managing AI prompts with role-based access control. Features separate dashboards for Super Admins, Admins, Content Managers, and Viewers with prompt management, user management, and channel organization capabilities.

## Tech Stack
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management
- **React Hot Toast** - Notifications
- **Three.js & React Three Fiber** - 3D graphics
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icons

## How to Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   Create a `.env` file in the client directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
