#!/bin/bash

# Start services in development mode
echo "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

# Install dependencies
echo "Installing backend dependencies..."
npm install

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Run database migrations
echo "Running database migrations..."
npm run migrate

# Start backend and frontend in development mode
echo "Starting backend and frontend in development mode..."
concurrently "npm run dev" "cd frontend && npm run dev"