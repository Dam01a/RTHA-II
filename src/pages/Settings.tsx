import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Phone,
  Moon,
  Sun,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
  Mail,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { mockEmergencyContacts } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { EmergencyContact } from '@/types/health';

export default function Settings() {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(mockEmergencyContacts);
  const [settings, setSettings] = useState({
    medicationReminders: true,
    appointmentReminders: true,
    refillAlerts: true,
    emergencyAlerts: true,
    darkMode: false,
    largeText: false,
    highContrast: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account</p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
            JD
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">John Doe</h3>
            <p className="text-sm text-muted-foreground">john.doe@email.com</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </motion.div>

      {/* Emergency Contacts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <Phone className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Emergency Contacts</h3>
              <p className="text-sm text-muted-foreground">People to notify in emergencies</p>
            </div>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group flex items-center justify-between rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {contact.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{contact.phone}</span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">Manage your alert preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'medicationReminders' as const, label: 'Medication Reminders', desc: 'Get notified when it\'s time to take medication' },
            { key: 'appointmentReminders' as const, label: 'Appointment Reminders', desc: 'Receive alerts before scheduled appointments' },
            { key: 'refillAlerts' as const, label: 'Refill Alerts', desc: 'Be notified when medication supply is low' },
            { key: 'emergencyAlerts' as const, label: 'Emergency Alerts', desc: 'Critical notifications for emergencies' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => toggleSetting(item.key)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Accessibility Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
            <Heart className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Accessibility</h3>
            <p className="text-sm text-muted-foreground">Customize your experience</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'largeText' as const, label: 'Large Text', desc: 'Increase font size for better readability' },
            { key: 'highContrast' as const, label: 'High Contrast', desc: 'Enhance visual contrast for visibility' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => toggleSetting(item.key)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <Shield className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Security</h3>
            <p className="text-sm text-muted-foreground">Protect your account</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Change Password', desc: 'Update your account password' },
            { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
            { label: 'Biometric Login', desc: 'Use fingerprint or face recognition' },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
