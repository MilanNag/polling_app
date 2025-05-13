# Interactive Polling Application - Visual Structure

## Application Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Client (Browser)                   │
│                                                     │
│  ┌─────────────────┐          ┌─────────────────┐  │
│  │                 │          │                 │  │
│  │  React Frontend │◄─────────►   WebSocket     │  │
│  │                 │          │   Connection    │  │
│  └────────┬────────┘          └────────┬────────┘  │
│           │                            │           │
└───────────┼────────────────────────────┼───────────┘
            │                            │
            │ HTTP Requests              │ Real-Time Events
            ▼                            ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                 Server (Node.js)                    │
│                                                     │
│  ┌─────────────────┐          ┌─────────────────┐  │
│  │                 │          │                 │  │
│  │   REST API      │◄─────────►   WebSocket     │  │
│  │   (Express)     │          │   Server        │  │
│  └────────┬────────┘          └────────┬────────┘  │
│           │                            │           │
│           └──────────────┬─────────────┘           │
│                          │                         │
│                          ▼                         │
│                ┌─────────────────────┐             │
│                │                     │             │
│                │   Data Access Layer │             │
│                │   (Drizzle ORM)     │             │
│                │                     │             │
│                └──────────┬──────────┘             │
│                           │                        │
└───────────────────────────┼────────────────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │                     │
                  │      PostgreSQL     │
                  │      Database       │
                  │                     │
                  └─────────────────────┘
```

## Component Hierarchy

```
App
├── Layout
│   ├── Navigation
│   │   ├── Logo
│   │   └── UserProfileMenu
│   │       └── UserBadgeCollection
│   │           └── UserBadge
│   └── Content
│       ├── Pages
│       │   ├── HomePage
│       │   │   ├── PollsSection (Active)
│       │   │   │   └── PollCard
│       │   │   └── PollsSection (Closed)
│       │   │       └── PollCard
│       │   └── PollDetailsPage
│       │       └── PollDetailView
│       └── Modals
│           ├── LoginModal
│           ├── VoteModal
│           │   └── PollChart
│           └── PollDetailModal
│               └── PollChart
└── ErrorBoundary
```

## Data Flow Diagram

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│  User Actions  │─────►│  React State   │─────►│  API Requests  │
│                │      │  Management    │      │                │
└────────────────┘      └────────────────┘      └───────┬────────┘
                                                        │
                                                        ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│    UI Update   │◄─────│ React Renders  │◄─────│ Server Response│
│                │      │                │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
```

## Real-time Updates Flow

```
                    ┌────────────────┐
                    │                │
                    │  User A Votes  │
                    │                │
                    └───────┬────────┘
                            │
                            ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│  Vote in DB    │◄─────┤  API Server    │◄─────┤ HTTP Request   │
│                │      │                │      │                │
└───────┬────────┘      └────────────────┘      └────────────────┘
        │
        ▼
┌────────────────┐      ┌────────────────┐
│                │      │                │
│  WebSocket     │─────►│ Event to       │
│  Server        │      │ All Clients    │
│                │      │                │
└────────────────┘      └───────┬────────┘
                                │
                                ▼
                        ┌────────────────┐
                        │                │
                        │ UI Updates for │
                        │ All Users      │
                        │                │
                        └────────────────┘
```

## Database Entity Relationship Diagram

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│     Users      │──1───┤ User Stats     │──1───┤    Badges      │
│                │      │                │      │                │
└───────┬────────┘      └────────────────┘      └────────────────┘
        │
        │
        │1
        │
        ▼n
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │──1───┤                │──1───┤                │
│     Polls      │      │    Options     │      │     Votes      │
│                │      │                │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
```

## Test Coverage Structure

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                   Test Coverage                        │
│                                                        │
│  ┌───────────────────────┐    ┌───────────────────────┐│
│  │                       │    │                       ││
│  │   Component Tests     │    │    Server Tests       ││
│  │                       │    │                       ││
│  │  ┌─────────────────┐  │    │  ┌─────────────────┐  ││
│  │  │ UI Components   │  │    │  │ API Routes      │  ││
│  │  │ - Rendering     │  │    │  │ - Endpoints     │  ││
│  │  │ - Interactions  │  │    │  │ - Validation    │  ││
│  │  │ - State         │  │    │  │ - Auth          │  ││
│  │  └─────────────────┘  │    │  └─────────────────┘  ││
│  │                       │    │                       ││
│  │  ┌─────────────────┐  │    │  ┌─────────────────┐  ││
│  │  │ Hooks & Context │  │    │  │ Data Access     │  ││
│  │  │ - User Context  │  │    │  │ - DB Operations │  ││
│  │  │ - WebSocket     │  │    │  │ - Transactions  │  ││
│  │  │ - Forms         │  │    │  │ - Validation    │  ││
│  │  └─────────────────┘  │    │  └─────────────────┘  ││
│  │                       │    │                       ││
│  └───────────────────────┘    └───────────────────────┘│
│                                                        │
└────────────────────────────────────────────────────────┘
```