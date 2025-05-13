# Polling Application Project Structure

This document provides a comprehensive overview of the project's folder structure and file organization.

## Root Directory

```
polling-application/
├── client/                 # Frontend React application
├── server/                 # Backend Express server
├── shared/                 # Shared code between client and server
├── test/                   # Test files
├── .gitignore              # Git ignore file
├── API_CURL_EXAMPLES.md    # API documentation with cURL examples
├── components.json         # Shadcn UI components configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Lock file for dependencies
├── polling-app-api.postman_collection.json # Postman API collection
├── postcss.config.js       # PostCSS configuration
├── PROJECT_STRUCTURE.md    # This document
├── README.md               # Project readme
├── run-tests.sh            # Script for running tests
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── vitest.config.ts        # Vitest testing configuration
```

## Client Directory

```
client/
├── index.html              # Main HTML entry point
└── src/
    ├── components/         # UI components
    │   ├── error-boundary.tsx
    │   ├── layout.tsx
    │   ├── login-modal.tsx
    │   ├── poll-card.tsx
    │   ├── poll-chart.tsx
    │   ├── poll-detail-modal.tsx
    │   ├── poll-showcase.tsx
    │   ├── ui/             # Shadcn UI components
    │   │   ├── alert-dialog.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── form.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── popover.tsx
    │   │   ├── progress.tsx
    │   │   ├── radio-group.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── tabs.tsx
    │   │   ├── toast.tsx
    │   │   ├── toaster.tsx
    │   │   └── tooltip.tsx
    │   ├── user-badge-collection.tsx
    │   ├── user-badge.tsx
    │   ├── user-profile-menu.tsx
    │   └── vote-modal.tsx
    ├── context/            # React context providers
    │   └── user-context.tsx
    ├── hooks/              # Custom React hooks
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   └── use-websocket.ts
    ├── lib/                # Utility functions
    │   ├── queryClient.ts
    │   └── utils.ts
    ├── pages/              # Page components
    │   ├── home.tsx
    │   ├── not-found.tsx
    │   └── poll-details.tsx
    ├── App.tsx             # Main React component
    ├── index.css           # Global CSS styles
    └── main.tsx            # React entry point
```

## Server Directory

```
server/
├── db.ts                   # Database connection setup
├── index.ts                # Server entry point
├── replitAuth.ts           # Authentication with Replit
├── routes.ts               # API routes
├── storage.ts              # Data access layer
├── vite.ts                 # Vite server integration
└── websocket-types.ts      # WebSocket type definitions
```

## Shared Directory

```
shared/
└── schema.ts               # Database schema and type definitions
```

## Test Directory

```
test/
├── client/                 # Frontend tests
│   └── components/         # Component tests
│       ├── layout.test.tsx
│       ├── login-modal.test.tsx
│       ├── poll-card.test.tsx
│       ├── poll-chart.test.tsx
│       ├── poll-detail-modal.test.tsx
│       ├── user-badge-collection.test.tsx
│       ├── user-badge.test.tsx
│       ├── user-profile-menu.test.tsx
│       └── vote-modal.test.tsx
├── mocks/                  # Mock data for tests
│   └── data.ts
└── server/                 # Backend tests
    ├── routes.test.ts
    └── storage.test.ts
```

## Key Files Explanation

### Configuration Files

- **package.json**: Defines project dependencies, scripts for development, testing, and building.
- **tsconfig.json**: TypeScript compiler configuration.
- **vite.config.ts**: Configures the Vite development server and build process.
- **tailwind.config.ts**: Tailwind CSS configuration for styling.
- **drizzle.config.ts**: Configuration for Drizzle ORM, specifying database connection and schema locations.
- **components.json**: Configuration for Shadcn UI components.

### Core Application Files

- **client/src/main.tsx**: Entry point for the React application.
- **client/src/App.tsx**: Main React component that sets up routing and context providers.
- **server/index.ts**: Entry point for the Express server.
- **server/routes.ts**: Defines all API endpoints and handlers.
- **server/storage.ts**: Implements data access patterns using Drizzle ORM.
- **shared/schema.ts**: Defines database tables and types used across frontend and backend.

### Testing Files

- **test/client/components/**: Contains test files for React components.
- **test/server/**: Contains test files for backend logic.
- **test/mocks/data.ts**: Provides mock data for testing purposes.
- **vitest.config.ts**: Configuration for the Vitest testing framework.

## Database Models

The application uses the following primary data models:

### Users
- User accounts with authentication information.
- User statistics tracking polls created and votes submitted.

### Polls
- Poll questions with description and status information.
- Created by users with options for voting.

### Options
- Options for each poll that users can vote on.
- Tracks vote counts.

### Votes
- Records of user votes on poll options.
- Tracks which user voted for which option.

### Badges
- Achievement badges awarded to users.
- Different types and levels based on user activity.

## Key Application Features

1. **Authentication**: User login/logout managed through the server.
2. **Poll Management**: Create, read, update, and delete polls.
3. **Voting System**: Vote on polls and see results in real-time.
4. **Real-time Updates**: WebSocket implementation for live updates.
5. **User Profiles**: Stats tracking and badges for gamification.
6. **Responsive Design**: Mobile and desktop UI adaptation.
7. **Rich Visualizations**: Charts for poll results.