# RTHA - Real-Time Health App (Mobile)

A mobile health management app built with **Expo** and **React Native**, designed to run on **Expo Go**.

## Features

- **Dashboard** – Quick stats, today's medications, upcoming appointments, health overview
- **Medications** – Track medications, dosages, refill status, and mark as taken
- **Appointments** – View and manage medical appointments with calendar
- **Health** – Monitor vitals (blood pressure, heart rate, blood sugar, weight, temperature) with charts
- **Settings** – Profile, emergency contacts, notifications, accessibility, security
- **Emergency Button** – One-tap emergency assistance with countdown and contact notification

## Prerequisites

- Node.js (LTS)
- npm or yarn
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Quick Start

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start
```

Then:

1. Scan the QR code with your phone camera (iOS) or the Expo Go app (Android)
2. The app will load in Expo Go

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |

## Tech Stack

- **Expo SDK 52** – React Native development platform
- **Expo Router** – File-based routing
- **React Navigation** – Tab navigation
- **Lucide React Native** – Icons
- **react-native-gifted-charts** – Health metric charts
- **date-fns** – Date formatting

## Project Structure

```
app/
  _layout.tsx          # Root layout
  (tabs)/
    _layout.tsx        # Tab navigator
    index.tsx          # Dashboard
    medications.tsx
    appointments.tsx
    health.tsx
    settings.tsx
src/
  components/          # Shared components
  data/                # Mock data
  theme/               # Colors and styles
  types/               # TypeScript types
```
