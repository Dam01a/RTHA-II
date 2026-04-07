# Firestore Schema

## `users/{uid}/emergencyContacts/{contactId}`
- `name` (string, required)
- `phone` (string, required, E.164 preferred)
- `email` (string | null)
- `relationship` (string, required)
- `createdAt` (timestamp, server)
- `updatedAt` (timestamp, optional, server)

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
