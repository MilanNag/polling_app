# Interactive Polling Application

A full-stack real-time polling application that enables users to create, vote, and analyze polls with interactive features and engaging user experience.

## Features

- Create customized polls with multiple options
- Vote on active polls
- View detailed results with graphical representation
- Real-time updates through WebSockets
- User authentication
- Gamification with achievement badges
- Responsive design for desktop and mobile devices

## Technologies Used

- **Frontend**: React.js, TypeScript, Shadcn UI components, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **State Management**: TanStack Query
- **Real-time Communication**: WebSockets
- **Testing**: Vitest, React Testing Library

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- PostgreSQL (v14.0 or higher)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/polling-application.git
cd polling-application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/polling_db
SESSION_SECRET=your_session_secret
```

Replace the `DATABASE_URL` with your PostgreSQL connection string and set a strong `SESSION_SECRET` for session management.

### 4. Database Setup

The application uses Drizzle ORM for database migrations. Run the following command to set up your database schema:

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

This will start both the frontend and backend services. The application should now be running at [http://localhost:5000](http://localhost:5000).

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/                # Source files
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
├── server/                 # Backend Express application
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database operations
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema definitions
└── test/                   # Test files
```

## API Endpoints

### Polls

- `GET /api/polls/active` - Get all active polls
- `GET /api/polls/closed` - Get all closed polls
- `GET /api/polls/:id` - Get details of a specific poll
- `POST /api/polls` - Create a new poll
- `POST /api/polls/:id/vote` - Vote on a poll
- `PATCH /api/polls/:id/status` - Update poll status (active/inactive)
- `DELETE /api/polls/:id` - Delete a poll

### Users

- `GET /api/users/:userId/stats` - Get user statistics
- `POST /api/users` - Create a new user
- `GET /api/auth/user` - Get current authenticated user

## WebSocket Events

- `JOIN_POLL` - User joins a poll room
- `LEAVE_POLL` - User leaves a poll room
- `NEW_VOTE` - New vote submitted
- `POLL_UPDATE` - Poll details updated

## Running Tests

To run the test suite:

```bash
npm test
```

For test coverage report:

```bash
npm run test:coverage
```

## Deployment

For production deployment:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching
- [Recharts](https://recharts.org/) for chart visualizations