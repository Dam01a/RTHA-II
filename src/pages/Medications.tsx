import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Plus,
  Search,
  Clock,
  Bell,
  AlertTriangle,
  Check,
  X,
  Edit,
  Trash2,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockMedications } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Medication } from '@/types/health';

export default function Medications() {
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, taken: !med.taken } : med
      )
    );
  };

  const getRefillStatus = (med: Medication) => {
    if (!med.pillsRemaining || !med.totalPills) return null;
    const percentage = (med.pillsRemaining / med.totalPills) * 100;
    if (percentage <= 20) return 'critical';
    if (percentage <= 40) return 'warning';
    return 'good';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Medications
          </h1>
          <p className="text-muted-foreground">
            Manage your medications and reminders
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2 gradient-primary shadow-glow">
          <Plus className="h-5 w-5" />
          Add Medication
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
          placeholder="Search medications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 rounded-xl bg-card border-border"
        />
      </motion.div>

      {/* Medications List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMedications.map((med, index) => {
            const refillStatus = getRefillStatus(med);

            return (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {/* Check Button */}
                  <button
                    onClick={() => toggleMedication(med.id)}
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200',
                      med.taken
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    {med.taken ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Pill className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={cn(
                            'text-lg font-semibold transition-colors',
                            med.taken ? 'text-success line-through' : 'text-foreground'
                          )}
                        >
                          {med.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage} • {med.frequency}
                        </p>
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

                    {/* Schedule & Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{med.times.join(', ')}</span>
                      </div>

                      {med.refillReminder && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 text-sm text-primary">
                          <Bell className="h-4 w-4" />
                          <span className="font-medium">Refill alerts on</span>
                        </div>
                      )}
                    </div>

                    {/* Refill Status */}
                    {med.pillsRemaining && med.totalPills && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {med.pillsRemaining} of {med.totalPills} remaining
                            </span>
                          </div>
                          {refillStatus === 'critical' && (
                            <span className="flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="h-4 w-4" />
                              Refill needed
                            </span>
                          )}
                          {refillStatus === 'warning' && (
                            <span className="flex items-center gap-1 text-warning font-medium">
                              <AlertTriangle className="h-4 w-4" />
                              Running low
                            </span>
                          )}
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              refillStatus === 'critical'
                                ? 'bg-destructive'
                                : refillStatus === 'warning'
                                ? 'bg-warning'
                                : 'bg-success'
                            )}
                            style={{
                              width: `${(med.pillsRemaining / med.totalPills) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {med.notes && (
                      <p className="mt-3 text-sm text-muted-foreground italic">
                        💡 {med.notes}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredMedications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Pill className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No medications found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first medication to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddForm(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
