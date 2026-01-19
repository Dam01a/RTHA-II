import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockEmergencyContacts } from '@/data/mockData';
import { cn } from '@/lib/utils';

const COUNTDOWN_DURATION = 5;

export default function EmergencyButton() {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const cancelEmergency = useCallback(() => {
    setIsActivated(false);
    setCountdown(COUNTDOWN_DURATION);
    setIsEmergencyMode(false);
  }, []);

  const triggerEmergency = useCallback(() => {
    setIsEmergencyMode(true);
    // In a real app, this would trigger GPS sharing and contact notifications
    console.log('Emergency triggered! Contacting:', mockEmergencyContacts);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isActivated && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isActivated && countdown === 0) {
      triggerEmergency();
    }

    return () => clearInterval(timer);
  }, [isActivated, countdown, triggerEmergency]);

  const handleEmergencyPress = () => {
    if (!isActivated) {
      setIsActivated(true);
    }
  };

  return (
    <>
      {/* Main Emergency Button */}
      <motion.button
        onClick={handleEmergencyPress}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl p-4 text-left transition-all duration-300',
          isActivated
            ? 'gradient-emergency shadow-emergency'
            : 'bg-destructive/10 hover:bg-destructive/15'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl transition-all',
              isActivated
                ? 'bg-white/20'
                : 'bg-destructive/10 group-hover:bg-destructive/20'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-6 w-6 transition-colors',
                isActivated ? 'text-white' : 'text-destructive'
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                'font-semibold transition-colors',
                isActivated ? 'text-white' : 'text-destructive'
              )}
            >
              Emergency
            </p>
            <p
              className={cn(
                'text-xs transition-colors',
                isActivated ? 'text-white/80' : 'text-destructive/70'
              )}
            >
              One-tap assistance
            </p>
          </div>
        </div>
      </motion.button>

      {/* Emergency Modal */}
      <AnimatePresence>
        {isActivated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl"
            >
              {!isEmergencyMode ? (
                // Countdown Screen
                <div className="p-8 text-center">
                  <div className="relative mx-auto mb-6 h-32 w-32">
                    <svg className="h-full w-full -rotate-90 transform">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="364"
                        style={{
                          strokeDashoffset: 364 * (1 - countdown / COUNTDOWN_DURATION),
                          transition: 'stroke-dashoffset 1s linear',
                        }}
                        className="text-destructive"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-bold text-destructive">{countdown}</span>
                    </div>
                  </div>
                  
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    Emergency Alert
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Your emergency contacts will be notified in {countdown} seconds
                  </p>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={cancelEmergency}
                    className="w-full gap-2 border-2 border-muted-foreground/30"
                  >
                    <X className="h-5 w-5" />
                    Cancel Emergency
                  </Button>
                </div>
              ) : (
                // Emergency Active Screen
                <div className="gradient-emergency p-8 text-center text-white">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 animate-pulse-ring">
                    <Phone className="h-10 w-10" />
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold">
                    Help is on the way!
                  </h3>
                  <p className="mb-6 text-sm text-white/80">
                    Your emergency contacts have been notified
                  </p>

                  <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-white/10 p-3 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Sharing your location...</span>
                  </div>

                  <div className="space-y-2 text-left">
                    <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      Contacted:
                    </p>
                    {mockEmergencyContacts.slice(0, 2).map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-lg bg-white/10 p-3"
                      >
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-sm text-white/70">{contact.relationship}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={cancelEmergency}
                    className="mt-6 w-full bg-white text-destructive hover:bg-white/90"
                  >
                    I'm Safe - Cancel Alert
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
