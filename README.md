# Content Production Management System

A comprehensive platform for managing content production workflows across multiple platforms (YouTube, Instagram, Facebook).

## 📚 Documentation First

**Before making any changes, please review:**
- [Requirements Documentation](/docs/requirements/README.md) - Functional and non-functional requirements
- [UI Guidelines](/docs/ui/README.md) - Component guidelines and design system
- [UX Guidelines](/docs/ux/README.md) - User flows and usability standards

## Quick Start

```bash
# Check documentation before development
npm run docs:check

# Start development with documentation reminder
npm run pre-dev

# Or start normally
npm run dev
```

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
├── docs/            # Documentation
│   ├── requirements/
│   ├── ui/
│   └── ux/
└── .github/         # GitHub templates
```

## Features

- **Task Management**: Create and track content production tasks
- **Multi-Platform**: Support for YouTube, Instagram, Facebook
- **AI Integration**: AI-powered content generation
- **Analytics**: Performance tracking and reporting
- **Team Collaboration**: Role-based access and assignments

## Development Workflow

1. **Review Documentation**: Check relevant docs in `/docs/`
2. **Follow Guidelines**: Adhere to UI/UX standards
3. **Update Documentation**: Keep docs current with changes
4. **Test Thoroughly**: Ensure accessibility and performance

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT tokens
- **File Storage**: GridFS for uploads