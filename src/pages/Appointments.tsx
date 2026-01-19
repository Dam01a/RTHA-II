import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  MapPin,
  User,
  Bell,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockAppointments } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/health';
import { format, parseISO, isToday, isTomorrow, isPast, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const typeColors = {
  checkup: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  specialist: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
  lab: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  therapy: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  other: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/20' },
};

function formatAppointmentDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = apt.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  const appointmentDates = new Set(appointments.map((apt) => apt.date));

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Schedule and manage your medical appointments
          </p>
        </div>
        <Button className="gap-2 gradient-primary shadow-glow">
          <Plus className="h-5 w-5" />
          New Appointment
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search appointments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 rounded-xl bg-card border-border"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {sortedDates.map((date, dateIndex) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {formatAppointmentDate(date)}
              </h3>
              <div className="space-y-3">
                {groupedAppointments[date].map((apt, index) => {
                  const colors = typeColors[apt.type];

                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dateIndex * 0.1 + index * 0.05 }}
                      className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        {/* Time Column */}
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/5 text-center">
                          <span className="text-lg font-bold text-primary">
                            {apt.time.split(':')[0]}:{apt.time.split(':')[1]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {parseInt(apt.time) >= 12 ? 'PM' : 'AM'}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{apt.title}</h4>
                              <span
                                className={cn(
                                  'mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                                  colors.bg,
                                  colors.text,
                                  colors.border
                                )}
                              >
                                {apt.type}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {apt.doctorName && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span>{apt.doctorName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              <span>{apt.location}</span>
                            </div>
                            {apt.reminder && (
                              <div className="flex items-center gap-1.5 text-primary">
                                <Bell className="h-4 w-4" />
                                <span>Reminder set</span>
                              </div>
                            )}
                          </div>

                          {apt.notes && (
                            <p className="mt-3 text-sm text-muted-foreground italic">
                              📝 {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {sortedDates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No appointments found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Schedule your first appointment to get started'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Calendar Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-5 shadow-sm h-fit"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h4 className="font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-9" />
            ))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasAppointment = appointmentDates.has(dateStr);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentDay
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted',
                    !isSameMonth(day, currentMonth) && 'text-muted-foreground/50'
                  )}
                >
                  {format(day, 'd')}
                  {hasAppointment && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Appointment Types
            </p>
            {Object.entries(typeColors).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <div className={cn('h-3 w-3 rounded-full', colors.bg, colors.border, 'border')} />
                <span className="capitalize text-foreground">{type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
