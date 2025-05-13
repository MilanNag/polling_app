# Polling Application - Setup Instructions

This is a comprehensive polling application created with:
- React.js frontend with TypeScript
- Express.js backend
- PostgreSQL database
- WebSockets for real-time updates
- Authentication system
- Gamification (badges) feature

## Setup Instructions

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database

### Database Setup
1. Create a PostgreSQL database
2. Set up the `DATABASE_URL` environment variable pointing to your PostgreSQL instance

### Installation Steps
1. Extract the zip file to a directory of your choice
2. Navigate to the extracted directory in your terminal
3. Install dependencies:
   ```
   npm install
   ```
4. Initialize the database:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:3000`

## Features

### User Features
- User registration and login
- Create, view, and vote on polls
- View detailed poll results with charts
- Earn badges for user activities
- Share polls with unique shareable links

### Technical Features
- Real-time updates via WebSockets
- Responsive design for mobile and desktop
- Comprehensive test suite with high code coverage
- TypeScript for type safety
- Modern UI with Shadcn/UI components

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/polling_app
SESSION_SECRET=your_secure_session_secret
```

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run test` - Runs the test suite
- `npm run db:push` - Updates the database schema

## Documentation

Additional documentation files included in this package:
- `API_CURL_EXAMPLES.md` - Examples of API usage with curl
- `PROJECT_STRUCTURE.md` - Overview of the project structure
- `VISUAL_STRUCTURE.md` - Visual representation of the project architecture

Enjoy using the Polling Application!