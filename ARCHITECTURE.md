# RTHA - Project Architecture Baseline

> Real-Time Health App - Healthcare Management Application  
> Version: 1.0.0  
> Last Updated: January 22, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Diagram](#architecture-diagram)
5. [Component Architecture](#component-architecture)
6. [Data Layer](#data-layer)
7. [Routing](#routing)
8. [Design System](#design-system)
9. [State Management](#state-management)
10. [Future Considerations](#future-considerations)

---

## Overview

RTHA (Real-Time Health App) is a healthcare management application designed to help users manage medications, appointments, and health metrics. The application follows a component-based architecture using React with TypeScript.

### Key Features

- **Dashboard**: Central hub displaying health overview, medications, and appointments
- **Medication Management**: Track, manage, and monitor medication schedules
- **Appointment Scheduling**: View and manage healthcare appointments
- **Health Tracking**: Monitor vital signs and health metrics with visual charts
- **Emergency Button**: Quick access emergency contact system
- **Settings**: User profile, emergency contacts, and accessibility options

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | ^18.3.1 | UI component library |
| **Language** | TypeScript | ^5.x | Type-safe JavaScript |
| **Build Tool** | Vite | ^5.x | Fast development & bundling |
| **Styling** | Tailwind CSS | ^3.x | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Latest | Accessible component library |
| **Animations** | Framer Motion | ^12.27.1 | Smooth animations & transitions |
| **Routing** | React Router DOM | ^6.30.1 | Client-side routing |
| **State Management** | TanStack React Query | ^5.83.0 | Server state management |
| **Charts** | Recharts | ^2.15.4 | Data visualization |
| **Forms** | React Hook Form | ^7.61.1 | Form state management |
| **Validation** | Zod | ^3.25.76 | Schema validation |
| **Icons** | Lucide React | ^0.462.0 | Icon library |
| **Date Utilities** | date-fns | ^3.6.0 | Date manipulation |

---

## Project Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── HealthOverview.tsx      # Health metrics display
│   │   ├── QuickStats.tsx          # Summary statistics
│   │   ├── TodayMedications.tsx    # Daily medication list
│   │   └── UpcomingAppointments.tsx # Appointment preview
│   ├── emergency/
│   │   └── EmergencyButton.tsx     # Emergency contact trigger
│   ├── layout/
│   │   └── AppLayout.tsx           # Main application shell
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (40+ components)
├── data/
│   └── mockData.ts                 # Static mock data
├── hooks/
│   ├── use-mobile.tsx              # Mobile detection hook
│   └── use-toast.ts                # Toast notification hook
├── lib/
│   └── utils.ts                    # Utility functions (cn helper)
├── pages/
│   ├── Appointments.tsx            # Appointments management
│   ├── Dashboard.tsx               # Main dashboard
│   ├── Health.tsx                  # Health tracking
│   ├── Medications.tsx             # Medication management
│   ├── NotFound.tsx                # 404 page
│   └── Settings.tsx                # User settings
├── types/
│   └── health.ts                   # TypeScript interfaces
├── App.tsx                         # Root component & routing
├── App.css                         # Global styles
├── index.css                       # Design system tokens
└── main.tsx                        # Application entry point

public/
├── favicon.ico
├── placeholder.svg
└── robots.txt

Configuration Files:
├── tailwind.config.ts              # Tailwind configuration
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION SHELL                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        App.tsx (Router)                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                  │                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     AppLayout Component                        │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────────────┐ │  │
│  │  │   Sidebar   │  │              Main Content                │ │  │
│  │  │  (Desktop)  │  │                                         │ │  │
│  │  │             │  │  ┌─────────────────────────────────────┐│ │  │
│  │  │  - Home     │  │  │           Page Components           ││ │  │
│  │  │  - Meds     │  │  │                                     ││ │  │
│  │  │  - Appts    │  │  │  Dashboard │ Medications │ Health   ││ │  │
│  │  │  - Health   │  │  │  Appointments │ Settings             ││ │  │
│  │  │  - Settings │  │  │                                     ││ │  │
│  │  │             │  │  └─────────────────────────────────────┘│ │  │
│  │  │  Emergency  │  │                                         │ │  │
│  │  │   Button    │  └─────────────────────────────────────────┘ │  │
│  │  └─────────────┘                                              │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Bottom Navigation (Mobile)                  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                              DATA FLOW
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │   types/health.ts   │  │         data/mockData.ts            │   │
│  │                     │  │                                     │   │
│  │  - Medication       │  │  - mockMedications[]                │   │
│  │  - Appointment      │  │  - mockAppointments[]               │   │
│  │  - HealthMetric     │  │  - mockHealthMetrics[]              │   │
│  │  - EmergencyContact │  │  - mockEmergencyContacts[]          │   │
│  │  - User             │  │  - mockUser                         │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

                              UI LAYER
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         UI FOUNDATION                                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │   shadcn/ui     │  │   Tailwind CSS   │  │  Framer Motion    │   │
│  │   Components    │  │   Design Tokens  │  │   Animations      │   │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Layout Components

#### AppLayout (`src/components/layout/AppLayout.tsx`)
The main application shell providing:
- **Desktop**: Fixed sidebar navigation (left side)
- **Mobile**: Header with hamburger menu + bottom tab navigation
- **Emergency Button**: Floating action button for emergencies
- **Sheet Navigation**: Mobile slide-out menu

### Dashboard Components

| Component | File | Purpose |
|-----------|------|---------|
| QuickStats | `dashboard/QuickStats.tsx` | Displays summary cards for medications and appointments |
| TodayMedications | `dashboard/TodayMedications.tsx` | Lists medications due today with completion toggle |
| UpcomingAppointments | `dashboard/UpcomingAppointments.tsx` | Shows next 3 appointments with details |
| HealthOverview | `dashboard/HealthOverview.tsx` | Displays latest health metrics with visual indicators |

### Page Components

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/` | Overview of all health data |
| Medications | `/medications` | Search, filter, manage medications |
| Appointments | `/appointments` | Calendar view, appointment cards |
| Health | `/health` | Metrics tracking, trend charts |
| Settings | `/settings` | Profile, contacts, preferences |

### Emergency Component

#### EmergencyButton (`src/components/emergency/EmergencyButton.tsx`)
- Floating action button with pulsing animation
- 5-second countdown before triggering emergency
- Dialog with cancel option
- Simulates emergency contact notification

---

## Data Layer

### TypeScript Interfaces (`src/types/health.ts`)

```typescript
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string[];
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  refillDate?: string;
  instructions?: string;
  sideEffects?: string[];
  taken?: boolean;
}

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  type: 'in-person' | 'virtual' | 'phone';
  notes?: string;
  reminder?: boolean;
}

interface HealthMetric {
  id: string;
  type: 'blood-pressure' | 'heart-rate' | 'blood-sugar' | 
        'weight' | 'temperature' | 'oxygen';
  value: string | number;
  unit: string;
  timestamp: string;
  notes?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  emergencyContacts: EmergencyContact[];
}
```

### Mock Data (`src/data/mockData.ts`)
Static data arrays providing sample data for development:
- `mockMedications`: 4 sample medications
- `mockAppointments`: 4 sample appointments
- `mockHealthMetrics`: 6 health readings
- `mockEmergencyContacts`: 2 emergency contacts
- `mockUser`: Sample user profile

---

## Routing

### Route Configuration (`src/App.tsx`)

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/medications" element={<Medications />} />
  <Route path="/appointments" element={<Appointments />} />
  <Route path="/health" element={<Health />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Navigation Items

| Label | Path | Icon |
|-------|------|------|
| Home | `/` | Home |
| Medications | `/medications` | Pill |
| Appointments | `/appointments` | Calendar |
| Health | `/health` | Heart |
| Settings | `/settings` | Settings |

---

## Design System

### Color Palette (HSL Values)

```css
/* Primary - Teal/Cyan */
--primary: 174 72% 40%
--primary-foreground: 0 0% 100%

/* Background & Surface */
--background: 180 20% 98%
--card: 0 0% 100%
--muted: 180 15% 95%

/* Accents */
--accent: 174 72% 95%
--destructive: 0 84% 60%

/* Text */
--foreground: 200 25% 15%
--muted-foreground: 200 10% 45%
```

### Typography

- **Font Family**: Plus Jakarta Sans (Google Fonts)
- **Headings**: Semi-bold to Bold (600-700)
- **Body**: Regular (400)

### Spacing Scale

Tailwind default spacing scale (4px base unit):
- `p-4` = 16px
- `gap-6` = 24px
- `mb-8` = 32px

### Animation System

```css
/* Fade animations */
animate-fade-in: fade-in 0.3s ease-out

/* Scale animations */
animate-scale-in: scale-in 0.2s ease-out

/* Slide animations */
animate-slide-in-right: slide-in-right 0.3s ease-out
```

---

## State Management

### Current Implementation

| State Type | Solution | Usage |
|------------|----------|-------|
| UI State | React useState | Toggle states, form inputs |
| Server State | React Query (ready) | Prepared for API integration |
| Navigation | React Router | URL-based routing |
| Notifications | Sonner + shadcn Toast | User feedback |

### Local State Examples

```typescript
// Medication completion toggle
const [medications, setMedications] = useState(mockMedications);

// Search filtering
const [searchTerm, setSearchTerm] = useState('');

// Emergency countdown
const [countdown, setCountdown] = useState(5);
```

---

## Future Considerations

### Backend Integration (Lovable Cloud)

When backend is enabled, the following will be implemented:

1. **Authentication**
   - Email/password login
   - Session management
   - Protected routes

2. **Database Tables**
   - `users` - User profiles
   - `medications` - Medication records
   - `appointments` - Appointment scheduling
   - `health_metrics` - Health tracking data
   - `emergency_contacts` - Emergency contact list

3. **Real-time Features**
   - Push notifications for medication reminders
   - Appointment reminders
   - Health metric alerts

4. **Edge Functions**
   - Email notifications
   - SMS alerts
   - AI-powered health insights

### Planned Enhancements

- [ ] Caregiver dashboard with multi-user support
- [ ] Medication interaction checker
- [ ] Appointment booking integration
- [ ] Wearable device sync (Apple Health, Google Fit)
- [ ] PDF report generation
- [ ] Multi-language support

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Contact & Resources

- **Preview URL**: https://id-preview--50c23fcd-64e5-4b29-b1e6-6c8dbe7a4eda.lovable.app
- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)

---

*This document serves as the baseline architecture reference for the RTHA project. Update as the application evolves.*
