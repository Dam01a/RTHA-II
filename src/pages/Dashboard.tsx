import { motion } from 'framer-motion';
import QuickStats from '@/components/dashboard/QuickStats';
import TodayMedications from '@/components/dashboard/TodayMedications';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import HealthOverview from '@/components/dashboard/HealthOverview';
import { format } from 'date-fns';

export default function Dashboard() {
  const today = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          {greeting}, John! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <TodayMedications />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <UpcomingAppointments />
          <HealthOverview />
        </div>
      </div>
    </div>
  );
}
