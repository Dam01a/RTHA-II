import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Pill, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockMedications } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function TodayMedications() {
  const [medications, setMedications] = useState(mockMedications);

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, taken: !med.taken } : med
      )
    );
  };

  const takenCount = medications.filter((m) => m.taken).length;
  const progress = (takenCount / medications.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Today's Medications</h3>
          <p className="text-sm text-muted-foreground">
            {takenCount} of {medications.length} completed
          </p>
        </div>
        <Link to="/medications">
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-full rounded-full gradient-primary"
          />
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        {medications.map((med, index) => (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={cn(
              'group flex items-center gap-4 rounded-xl p-4 transition-all duration-200',
              med.taken
                ? 'bg-success/5 border border-success/20'
                : 'bg-muted/50 hover:bg-muted'
            )}
          >
            <button
              onClick={() => toggleMedication(med.id)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                med.taken
                  ? 'border-success bg-success text-success-foreground'
                  : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
              )}
            >
              {med.taken ? (
                <Check className="h-5 w-5" />
              ) : (
                <Pill className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium transition-colors',
                  med.taken ? 'text-success line-through' : 'text-foreground'
                )}
              >
                {med.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {med.dosage} • {med.frequency}
              </p>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{med.times[0]}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
