# Support System - Quick Reference

## Patient APIs (All Available)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/patient/support-queries` | Create new support query |
| GET | `/api/v1/patient/support-queries` | Get all patient's queries (with filters) |
| GET | `/api/v1/patient/support-queries/:id` | Get specific query with all messages |
| **POST** | **`/api/v1/patient/support-queries/:id/messages`** | **Patient sends message** |
| PUT | `/api/v1/patient/support-queries/:id/messages/:messageId` | Edit specific message (Patient) |
| PUT | `/api/v1/patient/support-queries/:id/read` | Mark messages as read |
| PUT | `/api/v1/patient/support-queries/:id/close` | Close support query |
| DELETE | `/api/v1/patient/support-queries/:id/clear-chat` | Clear chat messages (Patient) |

## Admin APIs (All Available)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/support-queries/statistics` | Get support system statistics |
| GET | `/api/v1/admin/support-queries` | Get all support queries (with filters) |
| **GET** | **`/api/v1/admin/support-queries/assigned`** | **Get assigned queries (for logged-in admin/agent)** |
| GET | `/api/v1/admin/support-queries/:id` | Get specific query with all messages |
| **POST** | **`/api/v1/admin/support-queries/:id/reply`** | **Admin replies to patient** |
| PUT | `/api/v1/admin/support-queries/:id/messages/:messageId` | Edit specific message (Admin) |
| PUT | `/api/v1/admin/support-queries/:id/assign` | Assign query to admin/agent |
| PUT | `/api/v1/admin/support-queries/:id/status` | Update query status (open/in_progress/resolved/closed) |
| PUT | `/api/v1/admin/support-queries/:id/read` | Mark patient messages as read |
| GET | `/api/v1/admin/support-queries/:id/patient-profile` | Get patient profile by query ID |
| DELETE | `/api/v1/admin/support-queries/:id/clear-chat` | Clear chat messages (Admin) |

## Message Flow

```
Patient → POST /patient/support-queries/:id/messages
    ↓
Admin → POST /admin/support-queries/:id/reply  ← REPLY FROM HERE
    ↓
Patient → GET /patient/support-queries/:id (sees reply)
```

## Authentication

- **Patient APIs**: Require `Authorization: Bearer <patient_token>`
- **Admin APIs**: Require `Authorization: Bearer <admin_token>` + Admin role

## Admin Capabilities

### 1. View & Filter Queries
- Get all support queries with filters:
  - `status` - open, in_progress, resolved, closed
  - `category` - general, order, payment, refund, technical, medication, prescription, other
  - `priority` - low, medium, high, urgent
  - `assignedTo` - Filter by assigned admin/agent
  - `patientId` - Filter by patient
  - `search` - Search by query number, subject, or message
  - `startDate` / `endDate` - Date range filtering
  - `page` / `limit` - Pagination

### 2. Reply to Patient
- Admin can reply to patient messages
- Automatically changes status from `open` to `in_progress`
- Reply stored in Firebase + MongoDB

### 3. Assign Queries
- Assign support query to another admin or sub-admin
- Automatically changes status to `in_progress` if currently `open`

### 3a. View Assigned Queries (For Assigned Admin/Agent)
- **GET** `/api/v1/admin/support-queries/assigned`
- Shows all queries assigned to the logged-in admin/agent
- Includes unread count
- Supports filtering by status, category, priority, search, date range
- Assigned agent can see their assigned patients and chat with them

### 4. Update Status
- Change query status: `open` → `in_progress` → `resolved` → `closed`
- Can add resolution notes when resolving
- Tracks who resolved/closed and when

### 5. Mark as Read
- Mark all patient messages as read
- Updates read status in Firebase and MongoDB

### 6. View Statistics
- Total queries count
- Queries by status (open, in_progress, resolved, closed)
- Queries by priority (low, medium, high, urgent)
- Queries by category
- Unread messages count (by support team and by patients)
- Recent queries (last 7 days)

### 7. View Patient Profile
- Get patient profile by query ID
- See patient details, user info, medical history, etc.
- Useful to understand patient context before replying

### 8. Clear Chat
- Admin can clear all chat messages for a query
- Removes all messages from Firebase
- Resets message count and last message
- Useful for cleaning up old conversations

### 9. Edit Messages
- Admin can edit any message in a query
- Patient can only edit their own messages
- **Time Restriction**: Messages can only be edited within 5 minutes of sending
- **Edit History**: Previous message versions stored for 1 hour
  - Old message text stored in `editHistory` array
  - Each entry has `text`, `editedAt`, and `expiresAt` (1 hour from edit)
  - Expired entries automatically cleaned up
- Message is updated in Firebase with `edited: true` flag
- Tracks who edited and when (for admin edits)
- Preserves `editedAt` (first edit time) and updates `lastEditedAt` (last edit time)
- Updates last message if edited message is the latest

## Key Points

✅ All patient APIs are implemented and working  
✅ All admin APIs are implemented and working  
✅ Patient sends messages via: `POST /patient/support-queries/:id/messages`  
✅ Admin replies via: `POST /admin/support-queries/:id/reply`  
✅ Admin can assign, update status, and manage all queries  
✅ Admin can view patient profile by query ID  
✅ Patient and Admin can clear chat messages  
✅ Patient and Admin can edit messages (patient can only edit own messages)  
✅ Messages stored in Firebase (real-time) + MongoDB (persistence)  
✅ Patient can see all messages when fetching query by ID  
✅ Admin can see all messages when fetching query by ID

