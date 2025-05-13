# Polling Application API - cURL Examples

This document provides ready-to-use cURL examples for interacting with the Polling Application API. These examples are useful for command-line testing or implementing API calls in different programming languages.

## Base URL

For local development:
```
http://localhost:5000
```

## Polls

### Get Active Polls

```bash
curl -X GET "http://localhost:5000/api/polls/active" \
     -H "Content-Type: application/json"
```

### Get Closed Polls

```bash
curl -X GET "http://localhost:5000/api/polls/closed" \
     -H "Content-Type: application/json"
```

### Get Poll Details

```bash
curl -X GET "http://localhost:5000/api/polls/1" \
     -H "Content-Type: application/json"
```

### Create New Poll

```bash
curl -X POST "http://localhost:5000/api/polls" \
     -H "Content-Type: application/json" \
     -d '{
           "question": "What is your favorite programming language?",
           "description": "Vote for your preferred programming language",
           "userId": "user_123",
           "options": [
             "JavaScript",
             "Python",
             "Java", 
             "C#",
             "TypeScript"
           ]
         }'
```

### Vote on Poll

```bash
curl -X POST "http://localhost:5000/api/polls/1/vote" \
     -H "Content-Type: application/json" \
     -d '{
           "userId": "user_123",
           "optionId": 2
         }'
```

### Update Poll Status

```bash
curl -X PATCH "http://localhost:5000/api/polls/1/status" \
     -H "Content-Type: application/json" \
     -d '{
           "userId": "user_123",
           "isActive": false
         }'
```

### Delete Poll

```bash
curl -X DELETE "http://localhost:5000/api/polls/1?userId=user_123" \
     -H "Content-Type: application/json"
```

## Users

### Get User Stats

```bash
curl -X GET "http://localhost:5000/api/users/user_123/stats" \
     -H "Content-Type: application/json"
```

### Create User

```bash
curl -X POST "http://localhost:5000/api/users" \
     -H "Content-Type: application/json" \
     -d '{
           "username": "newuser"
         }'
```

### Get Current User

```bash
curl -X GET "http://localhost:5000/api/auth/user" \
     -H "Content-Type: application/json" \
     --cookie "connect.sid=your_session_cookie"
```

### Login

```bash
curl -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
           "username": "existinguser"
         }' \
     -c cookies.txt
```

### Logout

```bash
curl -X POST "http://localhost:5000/api/auth/logout" \
     -H "Content-Type: application/json" \
     --cookie "connect.sid=your_session_cookie"
```

## WebSocket API

The application also uses WebSockets for real-time updates. Below are examples showing how to use WebSockets with the `wscat` tool (you can install it via `npm install -g wscat`):

### Connect to WebSocket

```bash
wscat -c ws://localhost:5000/ws
```

### Join a Poll Room

After connecting, send a message to join a specific poll:

```json
{
  "type": "JOIN_POLL",
  "payload": {
    "pollId": 1,
    "userId": "user_123"
  }
}
```

### Leave a Poll Room

```json
{
  "type": "LEAVE_POLL",
  "payload": {
    "pollId": 1,
    "userId": "user_123"
  }
}
```

### Example of Incoming Message on Vote

When someone votes on a poll you're watching, you'll receive a message like:

```json
{
  "type": "NEW_VOTE",
  "payload": {
    "pollId": 1,
    "optionId": 2,
    "voteCount": 21,
    "totalVotes": 54
  }
}
```

## Response Examples

### Poll Object

```json
{
  "id": 1,
  "question": "What is your favorite programming language?",
  "description": "Vote for your preferred language",
  "userId": "user_123",
  "isActive": true,
  "createdAt": "2023-05-11T15:30:00.000Z",
  "updatedAt": "2023-05-11T15:30:00.000Z",
  "isRemoved": false,
  "options": [
    {
      "id": 1,
      "pollId": 1,
      "text": "JavaScript",
      "voteCount": 15
    },
    {
      "id": 2,
      "pollId": 1,
      "text": "Python",
      "voteCount": 20
    },
    {
      "id": 3,
      "pollId": 1,
      "text": "Java",
      "voteCount": 8
    },
    {
      "id": 4,
      "pollId": 1,
      "text": "C#",
      "voteCount": 10
    }
  ],
  "totalVotes": 53
}
```

### User Stats Object

```json
{
  "id": 1,
  "userId": "user_123",
  "username": "testuser",
  "pollsCreated": 5,
  "votesSubmitted": 12,
  "badges": [
    {
      "id": 1,
      "userId": "user_123",
      "type": "POLLS_CREATED",
      "level": 1,
      "createdAt": "2023-05-11T15:30:00.000Z"
    },
    {
      "id": 2,
      "userId": "user_123",
      "type": "VOTES_SUBMITTED",
      "level": 2,
      "createdAt": "2023-05-11T15:30:00.000Z"
    }
  ]
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in case of failures. Here's an example error response:

```json
{
  "error": true,
  "message": "Poll not found"
}
```

Common error status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (server-side problem)