# Firestore Schema

## `users/{uid}/emergencyContacts/{contactId}`
- `name` (string, required)
- `phone` (string, required, E.164 preferred)
- `email` (string | null)
- `relationship` (string, required)
- `createdAt` (timestamp, server)
- `updatedAt` (timestamp, optional, server)

## `users/{uid}/healthMetrics/{metricId}`
- `type` (string, required: `blood_pressure` | `heart_rate` | `blood_sugar` | `weight` | `temperature`)
- `recordedAt` (string, ISO-8601, required)
- `unit` (string | null, required for display)
- `value` (number | null, scalar metrics only)
- `systolic` (number | null, blood pressure only)
- `diastolic` (number | null, blood pressure only)
- `notes` (string | null)
- `createdAt` (timestamp, server)
- `updatedAt` (timestamp, server)

## `users/{uid}/appointments/{appointmentId}`
- `title` (string, required)
- `date` (string, `YYYY-MM-DD`, required)
- `time` (string, `HH:mm`, required)
- `location` (string, required)
- `doctorName` (string | null)
- `type` (string, required)
- `notes` (string | null)
- `reminder` (boolean, required)
- `createdAt` (timestamp, server)
- `updatedAt` (timestamp, server)

## `emergencyEvents/{eventId}`
- `userId` (string, required)
- `userEmail` (string | null)
- `timestamp` (string, ISO-8601, required)
- `locationShared` (boolean, required)
- `location` (map, optional)
  - `latitude` (number)
  - `longitude` (number)
  - `accuracyMeters` (number, optional)
  - `locationLink` (string)
- `message` (string, required)
- `dispatchResult` (map, required)
  - `status` ("sent" | "partial_failure" | "failed")
  - `contactedPhones` (array<string>)
  - `failedPhones` (array<string>)
- `createdAt` (timestamp, server)
