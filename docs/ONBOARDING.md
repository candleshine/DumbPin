# DumbPin Developer Onboarding Guide

Welcome to the DumbPin development team! This guide will help you get up to speed with our project, understand its architecture, and start contributing effectively.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Architecture](#project-architecture)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Contribution Process](#contribution-process)
8. [Useful Resources](#useful-resources)

## Project Overview

DumbPin is an interactive visual collaboration tool that allows users to transform images and maps into interactive canvases. Our application enables users to:

- 🖼️ Place pins on images with custom labels and descriptions
- 🌍 Create custom maps with personalized markers
- 🎨 Customize pins, labels, and legends
- 🤝 Share creations and collaborate with others
- 📥 Download and share the final product

Our target users include tour guides, photographers, world travelers, and event organizers who need a simple yet powerful way to annotate and share visual content.

## Development Environment Setup

### Prerequisites

- Node.js (>=20.0.0)
- npm (comes with Node.js)
- Git

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dumbPin.git
   cd dumbPin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Configure any necessary environment variables

4. Start the development server:
   ```bash
   # For frontend development
   npm run dev:frontend
   
   # For backend development
   npm run dev:backend
   
   # For full-stack development
   npm run dev
   ```

### Docker Setup (Alternative)

If you prefer using Docker:

```bash
docker-compose up
```

## Project Architecture

DumbPin follows a modern web application architecture with separate frontend and backend components.

### System Overview

The application consists of these key components:

1. **User Interface**: The frontend that users interact with
2. **Core Application**: Central business logic
3. **Image Processing**: Handles image uploads and pin placement
4. **Data Persistence**: Manages storage of user data
5. **Canvas Rendering**: Displays images with interactive pins

### Frontend Architecture

The frontend follows this flow:
- UI Components → State Management → Routing → API Communication → Backend

### Directory Structure

```
/dumbPin/
├── components/
│   ├── canvas/
│   │   ├── ImageCanvas.js
│   │   └── ZoomControls.js
│   ├── pins/
│   │   ├── PinCreator.js
│   │   └── PinEditor.js
│   └── ui/
│       ├── Button.js
│       └── Modal.js
├── contexts/
│   ├── AppState.js
│   └── AuthContext.js
├── pages/
│   ├── _app.js
│   ├── index.js
│   └── api/
├── backend/
│   ├── __tests__/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── utils/
└── shared/
    └── assets/
        ├── icons/
        ├── images/
        └── pins/
```

### Data Flow

The typical data flow for pin creation follows this sequence:
1. User uploads an image to the Canvas
2. Canvas sends the image to the Renderer for processing
3. Renderer communicates with PinManager to add pins
4. PinManager returns pin coordinates to the Renderer
5. Renderer updates the Canvas display
6. Canvas shows the updated image to the User

## Development Workflow

### Git Workflow

1. Create a new branch for your feature/bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with descriptive messages:
   ```bash
   git commit -m "Add feature: description of changes"
   ```

3. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub for review

### Deployment Process

Our deployment pipeline works as follows:
1. Developer pushes code to GitHub
2. GitHub triggers Vercel build
3. Vercel deploys to Preview environment for testing
4. After approval, Vercel deploys to Production
5. Monitoring tools (Sentry, Lighthouse) track performance

## Coding Standards

- We use ESLint and Prettier for code formatting
- Follow the existing code style in the project
- Write meaningful comments and documentation
- Use descriptive variable and function names
- Keep functions small and focused on a single responsibility

## Testing Guidelines

- Write tests for all new features and bug fixes
- We use Jest for testing both frontend and backend
- Aim for high test coverage, especially for critical paths
- Run tests locally before submitting a PR:
  ```bash
  npm test
  ```

## Contribution Process

1. Check the project roadmap and feature roadmap to understand priorities
2. Pick an issue to work on or propose a new feature
3. Discuss major changes with the team before implementation
4. Follow the Git workflow described above
5. Ensure all tests pass and code meets quality standards
6. Submit a PR with a clear description of changes
7. Address any feedback from code reviews

## Useful Resources

- [Project Roadmap](./project_roadmap.md): Overall project timeline and milestones
- [Feature Roadmap](./feature_roadmap.md): Planned features and their priorities
- [Architecture Document](./ARCHITECTURE.md): Detailed technical architecture
- [README](./README.md): Project overview and basic information

## Need Help?

If you have any questions or need assistance, please reach out to the team through:
- GitHub Issues for technical questions
- Team chat for quick discussions
- Weekly developer meetings for broader topics

Welcome aboard, and happy coding! 🚀