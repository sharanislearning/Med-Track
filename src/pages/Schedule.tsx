import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Sun, Leaf, Moon, Pill, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  notes: string;
  schedules: string[];
}

interface Log {
  id: number;
  medicine_id: number;
  scheduled_time: string;
  status: 'taken' | 'missed' | 'rescheduled' | 'pending';
  medicine_name?: string;
}

type TimePeriod = 'MORNING' | 'AFTERNOON' | 'EVENING';

interface RegimenItem {
  medicine: Medicine;
  time: string;
  period: TimePeriod;
  status: string;
}

function getTimePeriod(time: string): TimePeriod {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

function getPeriodIcon(period: TimePeriod) {
  switch (period) {
    case 'MORNING': return <Sun className="h-5 w-5" />;
    case 'AFTERNOON': return <Leaf className="h-5 w-5" />;
    case 'EVENING': return <Moon className="h-5 w-5" />;
  }
}

function getPeriodColor(period: TimePeriod) {
  switch (period) {
    case 'MORNING': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-200', accent: 'bg-amber-100' };
    case 'AFTERNOON': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-200', accent: 'bg-emerald-100' };
    case 'EVENING': return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500', border: 'border-indigo-200', accent: 'bg-indigo-100' };
  }
}

function formatTime12(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Schedule() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    fetchLogsForDate(selectedDate);
  }, [selectedDate]);

  const fetchMedicines = async () => {
    const res = await fetch('/api/medicines');
    if (res.ok) setMedicines(await res.json());
  };

  const fetchLogsForDate = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const res = await fetch(`/api/logs?start_date=${dateStr} 00:00:00&end_date=${dateStr} 23:59:59`);
    if (res.ok) setLogs(await res.json());
  };

  const handleTakeNow = async (medicineId: number, time: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const scheduledTime = `${dateStr} ${time}:00`;

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicine_id: medicineId,
        scheduled_time: scheduledTime,
        status: 'taken',
        notes: '',
      }),
    });
    fetchLogsForDate(selectedDate);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    // Pad beginning with nulls for alignment
    const paddedDays: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) paddedDays.push(null);
    paddedDays.push(...days);
    return paddedDays;
  }, [currentMonth]);

  // Build regimen items for selected date
  const regimenItems = useMemo((): RegimenItem[] => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const items: RegimenItem[] = [];
    medicines.forEach(med => {
      med.schedules.forEach(time => {
        const targetTime = `${dateStr} ${time}:00`;
        const log = logs.find(l => l.medicine_id === med.id && l.scheduled_time === targetTime);
        items.push({
          medicine: med,
          time,
          period: getTimePeriod(time),
          status: log ? log.status : 'pending',
        });
      });
    });
    // Sort by time
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  }, [medicines, logs, selectedDate]);

  const pendingCount = regimenItems.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="h-10 w-10 rounded-full bg-white border-2 border-black flex items-center justify-center hover:scale-105 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">Schedule</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-lime-brand border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Pill className="h-5 w-5 text-black" />
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="mb-8 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <CardContent className="p-5 md:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-heading font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="text-center text-xs font-bold text-gray-400 py-1">{label}</div>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150",
                      selected
                        ? "bg-dark-surface text-lime-brand font-bold shadow-md scale-110"
                        : today
                          ? "bg-lime-brand/30 text-black font-bold"
                          : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Regimen */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-heading font-bold">
            {isToday(selectedDate) ? "Today's Regimen" : format(selectedDate, 'MMM d') + ' Regimen'}
          </h2>
          {pendingCount > 0 && (
            <span className="text-sm font-bold text-lime-brand bg-dark-surface px-3 py-1 rounded-full border border-black">
              {pendingCount} Left
            </span>
          )}
        </div>

        {regimenItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-black border-dashed">
            <Pill className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No medications scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Add medicines from the Dashboard to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regimenItems.map((item, idx) => {
              const colors = getPeriodColor(item.period);
              const isTaken = item.status === 'taken';
              const isMissed = item.status === 'missed';
              const isPending = item.status === 'pending';

              return (
                <Card
                  key={`${item.medicine.id}-${item.time}-${idx}`}
                  className={cn(
                    "border-2 transition-all duration-200 overflow-hidden",
                    isPending
                      ? `${colors.border} border-dashed hover:shadow-lg hover:-translate-y-0.5`
                      : isTaken
                        ? "border-green-200 bg-green-50/50"
                        : "border-red-200 bg-red-50/50"
                  )}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {/* Period Icon */}
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5",
                          isTaken ? "bg-green-100 text-green-600" :
                            isMissed ? "bg-red-100 text-red-500" :
                              `${colors.accent} ${colors.icon}`
                        )}>
                          {getPeriodIcon(item.period)}
                        </div>

                        <div>
                          {/* Time & Period */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono-num font-bold text-gray-500">{formatTime12(item.time)}</span>
                            <span className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded" style={{
                              backgroundColor: isTaken ? '#dcfce7' : isMissed ? '#fee2e2' : undefined,
                              color: isTaken ? '#16a34a' : isMissed ? '#dc2626' : undefined,
                            }}>
                              <span className={cn(
                                !isTaken && !isMissed && `${colors.text} ${colors.bg} px-1.5 py-0.5 rounded`
                              )}>
                                {item.period}
                              </span>
                            </span>
                          </div>

                          {/* Medicine Info */}
                          <h3 className={cn(
                            "text-lg font-bold leading-tight",
                            isTaken ? "text-green-800" : isMissed ? "text-red-800" : "text-black"
                          )}>
                            {item.medicine.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">{item.medicine.dosage}</p>
                        </div>
                      </div>

                      {/* Action / Status */}
                      <div className="flex-shrink-0 ml-3">
                        {isTaken ? (
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        ) : isMissed ? (
                          <div className="h-10 w-10 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-500">✕</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleTakeNow(item.medicine.id, item.time)}
                            className="bg-dark-surface text-lime-brand font-bold text-xs px-4 py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[1px] active:translate-y-[2px] transition-all"
                          >
                            Take Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
