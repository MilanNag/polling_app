# Troubleshooting Guide

## Common Issues and Solutions

### "Cannot find module 'src/server.ts'" Error

This error occurs when the application can't find the server.ts file in the src directory.

**Solutions:**

1. **Create the correct directory structure:**
   ```bash
   npm run init
   ```
   
   This will create all the required directories and placeholder files.

2. **Manually fix the structure:**
   - Make sure you have a `src` directory at the project root
   - Move all backend files into the appropriate subdirectories in `src`
   - Ensure `server.ts` is directly inside the `src` folder

3. **Check your current directory:**
   Make sure you're running commands from the project root directory, not from a subdirectory.

### CSS Import Error

If you see errors related to CSS imports:

**Solution:**
- Make sure the `@import` statement in `frontend/src/index.css` is at the top of the file
- If necessary, edit the file manually to move the import to the top:
  ```css
  @import '../App.css';
  
  /* Other CSS rules... */
  ```

### Connection Issues with the Backend

If the frontend can't connect to the backend API:

**Solutions:**
1. **Check if backend is running:**
   ```bash
   npm run dev
   ```
   
   The backend should be running on http://localhost:3000

2. **Ensure PostgreSQL and Redis are running:**
   ```bash
   docker compose up -d postgres redis
   ```

3. **Check for service issues:**
   ```bash
   npm run setup:check
   ```
   
   This will check if all required services are running.

4. **Restart both frontend and backend:**
   ```bash
   npm run dev:all
   ```

### Database Connection Issues

If you see errors related to PostgreSQL:

**Solutions:**
1. **Check if PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```
   
2. **Restart PostgreSQL:**
   ```bash
   docker compose down
   docker compose up -d postgres
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

### Port Conflicts

If you get errors about ports already in use:

**Solutions:**
1. **Find and kill the process using the port:**
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # On macOS/Linux
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Change the port in the environment variables:**
   Create or edit `.env` file:
   ```
   PORT=3001
   ```

## Complete Project Setup Guide

If you're having multiple issues, follow this step-by-step guide to set up the project from scratch:

1. **Initialize the project structure:**
   ```bash
   npm run init
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start PostgreSQL and Redis:**
   ```bash
   docker compose up -d postgres redis
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the application in development mode:**
   ```bash
   npm run dev:all
   ```

6. **Verify everything is working:**
   - Backend should be available at http://localhost:3000
   - Frontend should be available at http://localhost:3001
   - Run `npm run setup:check` to confirm all components are properly installed

## Still Having Issues?

If you're still experiencing problems:

1. **Check for error logs** in the console output
2. **Verify file paths** in your code match the expected project structure
3. **Ensure all required ports** (3000, 3001, 5432 for PostgreSQL, 6379 for Redis) are available
4. **Check Docker** is running correctly with `docker ps`
5. **Clear node_modules** and reinstall if needed with:
   ```bash
   rm -rf node_modules frontend/node_modules
   npm install
   ```

For any other issues, please refer to the project's GitHub repository for additional support.