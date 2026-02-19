# Recruitment Agent API Routes

All routes use Next.js App Router format and are located in `/api/recruit/`.

## 1. POST `/api/recruit/run`

Runs the recruitment agent for a campaign, sending emails to un-contacted coaches.

**Request:**
```json
{
  "campaignId": "uuid",
  "maxEmails": 10,
  "maxDms": 0
}
```

**Response:**
```json
{
  "success": true,
  "emailsSent": 5,
  "dmsSent": 0,
  "errors": [],
  "remaining": 45,
  "sentCoachIds": ["coach-id-1", "coach-id-2"]
}
```

**Features:**
- Fetches campaign, athlete, and email template
- Respects daily email limit
- Sends 1 email per second to avoid rate limiting
- Records messages in database with Resend tracking IDs
- Returns count of remaining coaches to contact

---

## 2. GET `/api/recruit/stats`

Returns comprehensive campaign statistics.

**Query Parameters:**
- `campaignId` (required): Campaign UUID

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "athlete_id": "uuid",
    "name": "Campaign Name",
    "daily_email_limit": 10,
    "created_at": "2024-02-18T...",
    "status": "active"
  },
  "totalEmailsSent": 45,
  "dailyBreakdown": [
    {
      "date": "2024-02-18",
      "emailsSent": 10,
      "dmsSent": 0
    }
  ],
  "responseCount": 5,
  "openRate": 11.11
}
```

**Features:**
- Campaign details and configuration
- Total emails sent across all days
- Daily breakdown of sent messages
- Response count and calculated open rate

---

## 3. GET `/api/recruit/coaches`

Lists coaches with optional filtering.

**Query Parameters:**
- `division`: Filter by division (e.g., "D1", "D2")
- `state`: Filter by state (e.g., "CA", "NY")
- `campaignId`: Filter by campaign for contacted/non-contacted status
- `contacted`: "true" or "false" (only works with campaignId)

**Response:**
```json
{
  "success": true,
  "count": 150,
  "coaches": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john@school.edu",
      "school": "State University",
      "division": "D1",
      "state": "CA",
      "title": "Head Coach",
      "phone": "555-1234"
    }
  ]
}
```

---

## 4. POST `/api/recruit/coaches`

Manually adds a new coach.

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@school.edu",
  "school": "State University",
  "division": "D1",
  "state": "CA",
  "title": "Head Coach",
  "phone": "555-1234"
}
```

**Response:**
```json
{
  "success": true,
  "coach": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@school.edu",
    "school": "State University",
    "division": "D1",
    "state": "CA",
    "title": "Head Coach",
    "phone": "555-1234",
    "created_at": "2024-02-18T..."
  }
}
```

**Validations:**
- Returns 409 if coach with that email already exists
- Requires: first_name, last_name, email, school

---

## 5. GET `/api/recruit/responses`

Lists inbound responses from coaches.

**Query Parameters:**
- `campaignId` (required): Campaign UUID
- `coachId` (optional): Filter by specific coach

**Response:**
```json
{
  "success": true,
  "count": 5,
  "responses": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "coach_id": "uuid",
      "athlete_id": "uuid",
      "from_email": "john@school.edu",
      "from_name": "John Smith",
      "subject": "Re: Recruitment Opportunity",
      "body": "Thank you for reaching out...",
      "created_at": "2024-02-18T...",
      "forwarded_at": "2024-02-18T...",
      "forwarded_to": "parent@email.com"
    }
  ]
}
```

---

## 6. POST `/api/recruit/responses`

Records an inbound response and forwards to parent email.

**Request:**
```json
{
  "campaignId": "uuid",
  "coachId": "uuid",
  "athleteId": "uuid",
  "subject": "Re: Recruitment Opportunity",
  "body": "Thank you for reaching out...",
  "parentEmail": "parent@email.com"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "id": "uuid",
    "campaign_id": "uuid",
    "coach_id": "uuid",
    "athlete_id": "uuid",
    "from_email": "john@school.edu",
    "from_name": "John Smith",
    "subject": "Re: Recruitment Opportunity",
    "body": "Thank you for reaching out...",
    "created_at": "2024-02-18T...",
    "forwarded_at": "2024-02-18T...",
    "forwarded_to": "parent@email.com"
  },
  "message": "Response recorded and forwarded to parent email"
}
```

**Features:**
- Records coach response in database
- Automatically forwards to parent email via Resend
- Continues even if forwarding fails (logs error)

---

## 7. POST `/api/recruit/inbox`

Webhook endpoint for Resend inbound emails.

**Webhook Trigger:** When a coach replies to `josiah@localhustle.org`

**Expected Payload:**
```json
{
  "type": "email.inbound",
  "data": {
    "from_email": "coach@school.edu",
    "to_email": "josiah@localhustle.org",
    "subject": "Re: Recruitment Opportunity",
    "body": "Thank you for reaching out...",
    "in_reply_to": "original-message-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "responseId": "uuid",
  "message": "Response recorded and forwarded to parent"
}
```

**Features:**
- Matches inbound emails to campaigns via `in_reply_to` or recent messages
- Records responses with coach and campaign association
- Forwards to athlete's parent email automatically
- Handles missing coach gracefully

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success (GET requests)
- `201`: Success (POST requests)
- `400`: Bad request (missing/invalid parameters)
- `404`: Not found (resource doesn't exist)
- `409`: Conflict (resource already exists, e.g., coach email)
- `500`: Server error

Error responses follow this format:
```json
{
  "error": "Descriptive error message"
}
```

---

## Rate Limiting

- `/api/recruit/run` includes a 1-second delay between emails to avoid Resend rate limiting
- Daily email limit is enforced per campaign via `campaigns.daily_email_limit`

---

## Dependencies

All routes depend on:
- `@/lib/supabase` - Supabase admin client
- `@/lib/template-engine` - Template rendering and context building
- `@/lib/email-sender` - Email sending logic
- `resend` - Email delivery service (for forwarding)
