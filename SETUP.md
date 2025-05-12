# Setup Instructions for Team Polls Application

## Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- Docker and Docker Compose (for containerized setup)

## Directory Structure Setup

First, ensure you have the correct directory structure:

```
team-polls/
├── src/                  # All backend source code must be in this directory
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.ts
│   └── server.ts
├── migrations/
├── scripts/
├── frontend/            # Frontend React application
├── tests/
├── .github/
├── docker/
├── package.json
└── docker-compose.yml
```

Make sure to create the `src` directory first and place all your backend files inside it.

## Installation Steps

1. **Install backend dependencies**

```bash
npm install
```

2. **Install frontend dependencies**

```bash
cd frontend
npm install
cd ..
```

3. **Start PostgreSQL and Redis with Docker**

```bash
docker compose up -d postgres redis
```

4. **Run database migrations**

```bash
npm run migrate
```

## Development Workflow

You can run the backend and frontend separately:

**Backend**:
```bash
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

**Or run both together**:
```bash
npm run dev:all
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:3001`.

## Troubleshooting

If you encounter errors like "Cannot find module 'src/server.ts'", ensure that:

1. You've created the `src` directory
2. All backend files are inside the `src` directory
3. Your current working directory is the project root when running npm commands

If you get errors related to CSS, make sure the CSS import in `frontend/src/index.css` is at the top of the file.

If you have issues connecting to the backend, verify that:
1. PostgreSQL and Redis are running
2. The backend server is running on port 3000
3. The frontend proxy is correctly configured in `vite.config.ts`

## Production Build

To create a production build:

```bash
npm run build
```

This will build both the backend and frontend.

To start the production server:

```bash
npm start
```

## Docker Deployment

To run the entire application with Docker:

```bash
docker compose up
```

This will start all services (API, PostgreSQL, and Redis) in containers.