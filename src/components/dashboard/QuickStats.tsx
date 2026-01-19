import { motion } from 'framer-motion';
import { Pill, Calendar, HeartPulse, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle: string;
  colorClass: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, subtitle, colorClass, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            colorClass
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

export default function QuickStats() {
  const stats = [
    {
      icon: Pill,
      label: 'Medications Today',
      value: '4',
      subtitle: '2 completed, 2 remaining',
      colorClass: 'bg-primary/10 text-primary',
    },
    {
      icon: Calendar,
      label: 'Appointments',
      value: '3',
      subtitle: 'Next: Jan 22 at 10:00 AM',
      colorClass: 'bg-info/10 text-info',
    },
    {
      icon: HeartPulse,
      label: 'Blood Pressure',
      value: '120/80',
      subtitle: 'Last checked today',
      colorClass: 'bg-success/10 text-success',
    },
    {
      icon: Clock,
      label: 'Streak',
      value: '7',
      subtitle: 'Days of adherence',
      colorClass: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
}
