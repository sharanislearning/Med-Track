import { useEffect } from 'react';
import { format } from 'date-fns';

export default function NotificationManager() {
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
          if (med.schedules.includes(currentTime)) {
            new Notification(`Time to take ${med.name}`, {
              body: `Dosage: ${med.dosage}. ${med.notes || ''}`,
              icon: '/logo.png'
            });
          }
        });
      } catch (error) {
        console.error('Failed to check schedule', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkSchedule, 60000);

    // Initial check
    checkSchedule();

    return () => clearInterval(interval);
  }, []);

  return null;
}
