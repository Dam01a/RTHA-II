import { motion } from 'framer-motion';
import { HeartPulse, Activity, Droplets, Scale, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockHealthMetrics } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const metricConfig = {
  blood_pressure: {
    icon: HeartPulse,
    label: 'Blood Pressure',
    colorClass: 'bg-destructive/10 text-destructive',
  },
  heart_rate: {
    icon: Activity,
    label: 'Heart Rate',
    colorClass: 'bg-primary/10 text-primary',
  },
  blood_sugar: {
    icon: Droplets,
    label: 'Blood Sugar',
    colorClass: 'bg-info/10 text-info',
  },
  weight: {
    icon: Scale,
    label: 'Weight',
    colorClass: 'bg-success/10 text-success',
  },
  temperature: {
    icon: Activity,
    label: 'Temperature',
    colorClass: 'bg-warning/10 text-warning',
  },
};

export default function HealthOverview() {
  // Get the latest metric of each type
  const latestMetrics = Object.keys(metricConfig).map((type) => {
    const metric = mockHealthMetrics.find((m) => m.type === type);
    return metric || null;
  }).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Health Overview</h3>
          <p className="text-sm text-muted-foreground">Your latest vitals</p>
        </div>
        <Link to="/health">
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {latestMetrics.map((metric, index) => {
          if (!metric) return null;
          const config = metricConfig[metric.type as keyof typeof metricConfig];
          const Icon = config.icon;

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    config.colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {config.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {metric.value}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.date} at {metric.time}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
