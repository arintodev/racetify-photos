# API Documentation - Racetify Photos

Dokumentasi lengkap untuk API endpoints yang tersedia di aplikasi Racetify Photos.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

Semua endpoint memerlukan authentication header:

```
Authorization: Bearer {access_token}
```

Access token didapat dari Supabase Auth setelah login.

---

## Endpoints

### 1. Get Events

Mendapatkan list semua event yang tersedia.

**Endpoint:** `GET /api/events`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Marathon Jakarta 2025",
    "date": "2025-03-15",
    "location": "Jakarta",
    "description": "Marathon tahunan di Jakarta"
  },
  {
    "id": "uuid",
    "name": "Borobudur Marathon",
    "date": "2025-04-20",
    "location": "Magelang, Jawa Tengah",
    "description": "Marathon dengan view Candi Borobudur"
  }
]
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized: No token provided"
}
```

---

### 2. Upload Photo

Upload foto ke Supabase Storage dan return photo path.

**Endpoint:** `POST /api/upload/photo`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
```
file: File (image file)
eventId: string (UUID)
photographerId: string (UUID)
fileName: string
```

**Request Example:**
```javascript
const formData = new FormData()
formData.append('file', compressedFile, 'photo.jpg')
formData.append('eventId', 'event-uuid-here')
formData.append('photographerId', 'photographer-uuid-here')
formData.append('fileName', 'photo.jpg')

const response = await fetch('/api/upload/photo', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

**Response (200 OK):**
```json
{
  "success": true,
  "photoPath": "event_uuid/photographer_uuid/timestamp_photo.jpg"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: file, eventId, photographerId, fileName"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden: Photographer ID mismatch"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to upload photo: {error_message}"
}
```

---

### 3. Create Photo Job

Membuat entry di database queue untuk processing foto dengan AI.

**Endpoint:** `POST /api/upload/create-job`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "eventId": "uuid",
  "photographerId": "uuid",
  "photoPath": "event_uuid/photographer_uuid/timestamp_photo.jpg"
}
```

**Request Example:**
```javascript
const response = await fetch('/api/upload/create-job', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventId: 'event-uuid-here',
    photographerId: 'photographer-uuid-here',
    photoPath: 'event_uuid/photographer_uuid/timestamp_photo.jpg'
  })
})
```

**Response (200 OK):**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: eventId, photographerId, photoPath"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden: Photographer ID mismatch"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to create job: {error_message}"
}
```

---

## Upload Flow

Typical flow untuk upload foto:

```
1. User login → Get access_token
2. GET /api/events → Get list of events
3. User select event
4. User select files
5. For each file:
   a. Compress di browser
   b. POST /api/upload/photo → Get photoPath
   c. POST /api/upload/create-job → Create queue entry
6. Display upload status
```

**Example Implementation:**

```typescript
// 1. Get access token
const { data: { session } } = await supabase.auth.getSession()
const token = session.access_token

// 2. Get events
const events = await $fetch('/api/events', {
  headers: { Authorization: `Bearer ${token}` }
})

// 3. Upload photo
const formData = new FormData()
formData.append('file', compressedFile)
formData.append('eventId', selectedEvent.id)
formData.append('photographerId', user.id)
formData.append('fileName', file.name)

const uploadResult = await $fetch('/api/upload/photo', {
  method: 'POST',
  body: formData,
  headers: { Authorization: `Bearer ${token}` }
})

// 4. Create job
const jobResult = await $fetch('/api/upload/create-job', {
  method: 'POST',
  body: {
    eventId: selectedEvent.id,
    photographerId: user.id,
    photoPath: uploadResult.photoPath
  },
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - No token or invalid token |
| 403 | Forbidden - User tidak memiliki akses |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently tidak ada rate limiting, tapi untuk production sebaiknya implement:

- Max 100 requests per minute per user
- Max 1000 photos per day per photographer
- Max total storage 10GB per photographer

---

## Storage Structure

Foto disimpan di Supabase Storage dengan struktur:

```
bucket: event-photos
path: event_{event_id}/{photographer_id}/{timestamp}_{filename}

Example:
event-photos/
  └── event_abc123/
      └── photographer_xyz456/
          ├── 1709123456789_IMG_001.jpg
          ├── 1709123457890_IMG_002.jpg
          └── 1709123458901_IMG_003.jpg
```

---

## Database Schema

### Table: photo_jobs

```sql
CREATE TABLE photo_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  photographer_id UUID NOT NULL REFERENCES auth.users(id),
  photo_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)
```

**Status values:**
- `pending` - Menunggu processing
- `processing` - Sedang diproses oleh worker
- `completed` - Processing selesai
- `failed` - Processing gagal

---

## Worker Integration

Worker AI dapat mengakses queue dengan query:

```sql
-- Get pending jobs
SELECT id, photo_path, event_id, photographer_id
FROM photo_jobs
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 10;

-- Update status to processing
UPDATE photo_jobs
SET status = 'processing',
    updated_at = now()
WHERE id = :job_id;

-- Update status to completed
UPDATE photo_jobs
SET status = 'completed',
    processed_at = now(),
    updated_at = now()
WHERE id = :job_id;

-- Update status to failed
UPDATE photo_jobs
SET status = 'failed',
    error_message = :error_message,
    updated_at = now()
WHERE id = :job_id;
```

**Download foto dari storage:**

```javascript
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const { data, error } = await supabase
  .storage
  .from('event-photos')
  .download(photoPath)
```

---

## Security

### Authentication
- Semua endpoints require valid JWT token
- Token di-verify di server-side
- User ID di-extract dari token, tidak dipercaya dari request body

### Authorization
- Photographer hanya bisa upload ke folder mereka sendiri
- Photographer hanya bisa akses foto mereka sendiri
- Row Level Security (RLS) enabled di Supabase

### Validation
- File type validation (hanya image)
- File size validation (max 10MB)
- Path validation (prevent directory traversal)
- Input sanitization

### Storage Security
- Private bucket (not public)
- Signed URLs untuk download (jika diperlukan)
- Storage policies by photographer_id

---

## Testing

### Test dengan curl

```bash
# Get events
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upload photo
curl -X POST http://localhost:3000/api/upload/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "eventId=event-uuid" \
  -F "photographerId=photographer-uuid" \
  -F "fileName=photo.jpg"

# Create job
curl -X POST http://localhost:3000/api/upload/create-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-uuid",
    "photographerId": "photographer-uuid",
    "photoPath": "event_uuid/photographer_uuid/photo.jpg"
  }'
```

---

## Monitoring

Recommended metrics to monitor:

- Upload success rate
- Average upload time
- Failed upload reasons
- Storage usage per photographer
- Queue depth (pending jobs)
- Processing time per photo

---

## Support

Untuk pertanyaan atau issue, hubungi tim development Racetify Photos.
