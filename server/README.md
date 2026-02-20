# CreatorAI Server

## About
RESTful API backend for the CreatorAI prompt management system. Provides authentication, authorization, and CRUD operations for managing prompts, users, channels, and companies with role-based access control (Super Admin, Admin, Content Manager, Viewer).

## Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **Nodemon** - Development auto-reload

## How to Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   Create a `.env` file in the server directory:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/creatorai
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

3. **Start MongoDB**
   Ensure MongoDB is running on your system

4. **Start development server**
   ```bash
   nodemon app.js
   ```
   The server will run on `http://localhost:5000`

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/channels` - Channel management
- `/api/prompts` - Prompt CRUD operations
- `/api/prompt-types` - Prompt type management
- `/api/dashboard` - Dashboard analytics
- `/api/superadmin` - Super admin operations

## Project Structure

```
server/
├── config/         # Database configuration
├── controllers/    # Request handlers
├── middleware/     # Auth & role middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
└── app.js          # Main application file
```
