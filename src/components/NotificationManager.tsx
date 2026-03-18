import { useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface NotificationTracker {
  [key: string]: string;
}

export default function NotificationManager() {
  const notificationTrackerRef = useRef<NotificationTracker>({});
  const MAX_NOTIFICATIONS = 5;
  const NOTIFICATION_DELAY = 1000; // 1 second between notifications

  useEffect(() => {
    // Request notification permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkSchedule = async () => {
      if (Notification.permission !== 'granted') return;

      try {
        const res = await fetch('/api/medicines');
        if (!res.ok) return;
        const medicines = await res.json();

        const now = new Date();
        const currentTime = format(now, 'HH:mm');

        medicines.forEach((med: any) => {
          if (med.schedules && Array.isArray(med.schedules) && med.schedules.includes(currentTime)) {
            const medId = med.id || med.name;
            const tracker = notificationTrackerRef.current[medId];

            // Check if we already sent notifications for this time
            if (tracker !== currentTime) {
              // New time - send 5 notifications in 5 seconds
              notificationTrackerRef.current[medId] = currentTime;
              
              for (let i = 1; i <= MAX_NOTIFICATIONS; i++) {
                setTimeout(() => {
                  new Notification(`Time to take ${med.name}`, {
                    body: `Dosage: ${med.dosage}. ${med.notes || ''}\n(Notification ${i}/${MAX_NOTIFICATIONS})`,
                    icon: '/logo.png',
                    tag: `med-${med.id || med.name}-${i}`
                  });
                }, (i - 1) * NOTIFICATION_DELAY);
              }
            }
          }
        });
      } catch (error) {
        console.error('Failed to check schedule', error);
      }
    };

    // Check every 30 seconds for better accuracy
    const interval = setInterval(checkSchedule, 30000);

    // Initial check immediately
    checkSchedule();

    return () => clearInterval(interval);
  }, []);

  return null;
}
