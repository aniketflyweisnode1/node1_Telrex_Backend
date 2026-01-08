# Support System - Patient APIs Summary

## Overview
This document explains all available APIs for patients to interact with the support system, and how the reply system works.

## Patient APIs (All Available)

All patient APIs are available at: `/api/v1/patient/support-queries/*`

### 1. Create Support Query
**POST** `/api/v1/patient/support-queries`

Patient creates a new support query/ticket.

**Request Body:**
```json
{
  "message": "I need help with my order",
  "subject": "Order Issue",
  "priority": "high",
  "category": "order",
  "tags": ["delivery"]
}
```

**Response:** Returns created query with unique query number (e.g., Q-2025-1047)

---

### 2. Get All Support Queries
**GET** `/api/v1/patient/support-queries?status=open&page=1&limit=10`

Patient can view all their support queries with filtering options.

**Query Parameters:**
- `status` - Filter by: `open`, `in_progress`, `resolved`, `closed`
- `category` - Filter by category
- `priority` - Filter by priority
- `page` - Page number
- `limit` - Items per page

---

### 3. Get Support Query by ID
**GET** `/api/v1/patient/support-queries/:id`

Patient can view a specific query with all messages (from Firebase).

**Response:** Returns query details with all messages array

---

### 4. Send Message (Patient sends message)
**POST** `/api/v1/patient/support-queries/:id/messages`

**This is where patient sends messages to support team.**

**Request Body:**
```json
{
  "message": "Thank you for your response"
}
```

**Response:** Returns the sent message with timestamp

---

### 5. Mark Messages as Read
**PUT** `/api/v1/patient/support-queries/:id/read`

Patient marks support team messages as read.

---

### 6. Close Support Query
**PUT** `/api/v1/patient/support-queries/:id/close`

Patient can close their own support query.

---

## Admin Reply System (Where Replies Come From)

### Admin Reply API
**POST** `/api/v1/admin/support-queries/:id/reply`

**This is where admin/support staff replies to patient messages.**

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "message": "Hello! We have received your query and will help you."
}
```

**How it works:**
1. Patient sends message via: `POST /api/v1/patient/support-queries/:id/messages`
2. Admin/Support staff sees the query in admin panel
3. Admin replies via: `POST /api/v1/admin/support-queries/:id/reply`
4. Reply is stored in Firebase and MongoDB
5. Patient can see the reply when they fetch the query: `GET /api/v1/patient/support-queries/:id`

---

## Complete Message Flow

```
1. Patient creates query
   POST /api/v1/patient/support-queries
   ↓
2. Patient sends message
   POST /api/v1/patient/support-queries/:id/messages
   ↓
3. Admin views query (Admin Panel)
   GET /api/v1/admin/support-queries/:id
   ↓
4. Admin replies to patient
   POST /api/v1/admin/support-queries/:id/reply  ← REPLY COMES FROM HERE
   ↓
5. Patient views query with reply
   GET /api/v1/patient/support-queries/:id
   ↓
6. Patient can send another message
   POST /api/v1/patient/support-queries/:id/messages
   (Cycle continues...)
```

---

## Firebase Integration

- All messages are stored in Firebase Realtime Database for real-time updates
- Messages are also stored in MongoDB for persistence
- Firebase path: `support-chats/{queryId}/messages/`

---

## Status Flow

1. **open** - Query created, waiting for support
2. **in_progress** - Support team has replied/assigned
3. **resolved** - Issue resolved
4. **closed** - Query closed (no more messages)

---

## Important Notes

- All patient APIs require authentication (`Authorization: Bearer <token>`)
- Patient can only access their own queries
- Messages are stored in both Firebase (real-time) and MongoDB (persistence)
- Admin replies come from `/admin/support-queries/:id/reply` endpoint
- Patient can see all messages (patient + support) when fetching query by ID

