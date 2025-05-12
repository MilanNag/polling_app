# Fix for "Resource not found" (404) Error

If you're seeing the error `{"error":"Resource not found"}`, it means your request is hitting a route that doesn't exist in your Express application. Here's how to fix it:

## Step 1: Verify Your Server Is Running Correctly

1. Run the server with the simplified code we've provided:
   ```bash
   npm run dev
   ```

2. You should see output similar to:
   ```
   Server running on port 3000
   Test endpoint: http://localhost:3000/test
   API endpoint: http://localhost:3000/auth/anon (POST)
   ```

3. Test if the basic test endpoint is working:
   ```bash
   npm run test:api
   ```
   This will check multiple endpoints and show their responses.

## Step 2: Verify the URL You're Trying to Access

Make sure you're using the correct URL path. The available endpoints are:

- `GET /test` - Simple test endpoint
- `GET /health` - Health check endpoint
- `POST /auth/anon` - Create anonymous user
- `POST /poll` - Create a poll (requires authentication)
- `GET /poll/:id` - Get poll details (replace `:id` with the actual poll ID)
- `POST /poll/:id/vote` - Vote on a poll (requires authentication)

**⚠️ Important:** Note that most endpoints are POST, not GET. Make sure you're using the correct HTTP method.

## Step 3: Check for Common Errors

1. **Are you using the correct HTTP method?**
   - For example, `/auth/anon` requires a POST request, not GET

2. **Are you missing the leading slash?**
   - Correct: `http://localhost:3000/auth/anon`
   - Incorrect: `http://localhost:3000auth/anon`

3. **Are you using the correct port?**
   - Default is 3000 for the backend, 3001 for the frontend

4. **Are you adding extra path segments?**
   - Correct: `http://localhost:3000/auth/anon`
   - Incorrect: `http://localhost:3000/api/auth/anon`

## Step 4: Test with a Simple Tool

Use `curl` to verify your endpoints:

```bash
# Test endpoint
curl http://localhost:3000/test

# Health check
curl http://localhost:3000/health

# Anonymous authentication (POST request)
curl -X POST http://localhost:3000/auth/anon
```

## Step 5: Frontend Configuration

If you're trying to access the API from the frontend:

1. Check `frontend/vite.config.ts` to verify the proxy configuration:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/api/, ''),
     }
   }
   ```

2. Make sure your frontend API calls include `/api`:
   ```javascript
   fetch('/api/auth/anon', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   });
   ```
   
   The proxy will remove the `/api` prefix before forwarding to the backend.

## Step 6: Still Having Issues?

If you're still seeing the 404 error, try these additional steps:

1. **Check your frontend code** to make sure it's using the correct path
2. **Look at the browser's Network tab** to see exactly what URL is being requested
3. **Check for console errors** in both the browser and server logs
4. **Try direct API access** using Postman or similar tools

## Need More Help?

Run our test client to check if the endpoints are working:

```bash
npm run test:api
```

This will test all key endpoints and display their responses.