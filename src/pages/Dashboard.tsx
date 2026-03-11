import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Check, X, Clock, Trash2, Bell, Calendar, Zap } from 'lucide-react';
import { format } from 'date-fns';
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

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
    schedules: ['08:00'],
  });

  useEffect(() => {
    fetchMedicines();
    fetchLogs();
  }, []);

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
    });
  };

  const fetchMedicines = async () => {
    const res = await fetch('/api/medicines');
    if (res.ok) setMedicines(await res.json());
  };

  const fetchLogs = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const res = await fetch(`/api/logs?start_date=${today} 00:00:00&end_date=${today} 23:59:59`);
    if (res.ok) setLogs(await res.json());
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMed),
    });
    if (res.ok) {
      setShowAddForm(false);
      fetchMedicines();
      setNewMed({
        name: '',
        dosage: '',
        frequency: 'daily',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        notes: '',
        schedules: ['08:00'],
      });
    }
  };

  const handleDeleteMedicine = async (id: number) => {
    try {
      const res = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDeleteId(null);
        fetchMedicines();
        fetchLogs();
      }
    } catch (error) {
      console.error('Failed to delete medicine', error);
    }
  };

  const handleLogAction = async (medicineId: number, time: string, status: string) => {
    const scheduledTime = `${format(new Date(), 'yyyy-MM-dd')} ${time}:00`;

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicine_id: medicineId,
        scheduled_time: scheduledTime,
        status,
        notes: '',
      }),
    });
    fetchLogs();
  };

  const getLogStatus = (medId: number, time: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const targetTime = `${todayStr} ${time}:00`;
    const log = logs.find(l => l.medicine_id === medId && l.scheduled_time === targetTime);
    return log ? log.status : 'pending';
  };

  // Calculate daily progress
  const totalDoses = medicines.reduce((acc, med) => acc + med.schedules.length, 0);
  const takenDoses = logs.filter(l => l.status === 'taken').length;
  const progress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  return (
    <div className="min-h-screen bg-soft-bg pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-dark-surface text-white border-none shadow-[8px_8px_0px_0px_rgba(212,255,94,1)]">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lime-brand font-mono text-sm mb-2 tracking-wider uppercase">Daily Overview</h2>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                  You're doing <br /> <span className="text-lime-brand">great!</span>
                </h1>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Compliance Score</p>
                  <div className="text-6xl font-mono-num font-bold text-lime-brand">{progress}%</div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Doses Taken</p>
                  <p className="text-2xl font-bold">{takenDoses} <span className="text-gray-500">/ {totalDoses}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-rows-2 gap-6">
            {/* Quick Action: Add Med */}
            <Card className="bg-lime-brand border-2 border-black flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowAddForm(true)}>
              <CardContent className="p-0 flex flex-row items-center gap-3">
                <div className="bg-black text-lime-brand p-3 rounded-full">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-bold text-black text-lg">Add Med</span>
              </CardContent>
            </Card>

            {/* Quick Action: Notifications */}
            <Card className="bg-white border-2 border-black flex items-center justify-center">
              <CardContent className="p-0 flex flex-col items-center w-full">
                {notificationPermission === 'default' ? (
                  <div onClick={requestNotificationPermission} className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                    <Bell className="h-8 w-8 mb-2 text-black" />
                    <span className="font-bold text-sm">Enable Alerts</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-50">
                    <Check className="h-8 w-8 mb-2 text-green-600" />
                    <span className="font-bold text-sm">Alerts On</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Form Modal/Card */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white relative animate-in fade-in zoom-in duration-200">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setShowAddForm(false)}>
                <X className="h-6 w-6" />
              </Button>
              <CardHeader>
                <CardTitle className="text-2xl">Add New Medicine</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} required className="bg-soft-bg" />
                    </div>
                    <div>
                      <Label>Dosage</Label>
                      <Input value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} className="bg-soft-bg" />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <select
                        className="flex h-12 w-full rounded-xl border-2 border-black bg-soft-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        value={newMed.frequency}
                        onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newMed.schedules[0]}
                        onChange={e => setNewMed({ ...newMed, schedules: [e.target.value] })}
                        required
                        className="bg-soft-bg"
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={newMed.start_date} onChange={e => setNewMed({ ...newMed, start_date: e.target.value })} required className="bg-soft-bg" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button type="submit" variant="lime">Save Medicine</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medicine Grid */}
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-lime-brand fill-black" />
          Your Schedule
        </h3>

        {medicines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-black border-dashed">
            <p className="text-gray-500 mb-4">No medicines added yet.</p>
            <Button onClick={() => setShowAddForm(true)}>Get Started</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map(med => (
              <Card key={med.id} className="group hover:-translate-y-1 transition-transform duration-200">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <div className="bg-soft-bg text-xs font-bold px-2 py-1 rounded-md inline-block mb-2 border border-black/10">
                      {med.frequency}
                    </div>
                    <CardTitle className="text-xl font-bold">{med.name}</CardTitle>
                    <p className="text-sm text-gray-500 font-mono">{med.dosage}</p>
                  </div>
                  {confirmDeleteId === med.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-500 font-bold mr-1">Delete?</span>
                      <button
                        onClick={() => handleDeleteMedicine(med.id)}
                        className="h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-7 w-7 rounded-full bg-gray-200 text-black flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmDeleteId(med.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {med.schedules.map((time, idx) => {
                      const status = getLogStatus(med.id, time);
                      return (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-mono-num font-bold">{time}</span>
                          </div>

                          {status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLogAction(med.id, time, 'taken')}
                                className="h-8 w-8 rounded-full bg-lime-brand border border-black flex items-center justify-center hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                              >
                                <Check className="h-4 w-4 text-black" />
                              </button>
                              <button
                                onClick={() => handleLogAction(med.id, time, 'missed')}
                                className="h-8 w-8 rounded-full bg-white border border-black flex items-center justify-center hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                              >
                                <X className="h-4 w-4 text-black" />
                              </button>
                            </div>
                          ) : (
                            <span className={cn(
                              "text-xs font-bold px-3 py-1 rounded-full border border-black",
                              status === 'taken' ? "bg-lime-brand text-black" :
                                status === 'missed' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-800"
                            )}>
                              {status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
