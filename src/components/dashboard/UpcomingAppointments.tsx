import { motion } from 'framer-motion';
import { Calendar, MapPin, User, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAppointments } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

const typeColors = {
  checkup: 'bg-primary/10 text-primary border-primary/20',
  specialist: 'bg-info/10 text-info border-info/20',
  lab: 'bg-warning/10 text-warning border-warning/20',
  therapy: 'bg-success/10 text-success border-success/20',
  other: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

function formatAppointmentDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d, yyyy');
}

export default function UpcomingAppointments() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Upcoming Appointments</h3>
          <p className="text-sm text-muted-foreground">
            {mockAppointments.length} scheduled
          </p>
        </div>
        <Link to="/appointments">
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {mockAppointments.map((apt, index) => (
          <motion.div
            key={apt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/5 text-center">
                <span className="text-lg font-bold text-primary">
                  {format(parseISO(apt.date), 'd')}
                </span>
                <span className="text-xs font-medium text-primary">
                  {format(parseISO(apt.date), 'MMM')}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-foreground">{apt.title}</h4>
                    <span
                      className={cn(
                        'mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                        typeColors[apt.type]
                      )}
                    >
                      {apt.type}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-primary">
                    {formatAppointmentDate(apt.date)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{apt.time}</span>
                  </div>
                  {apt.doctorName && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{apt.doctorName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{apt.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
