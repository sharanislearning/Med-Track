import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format } from 'date-fns';

export default function Reports() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    
    const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
    setLoading(false);
  };

  // Process data for charts
  const statusData = [
    { name: 'Taken', value: stats.find(s => s.status === 'taken')?.count || 0, color: '#D4FF5E' },
    { name: 'Missed', value: stats.find(s => s.status === 'missed')?.count || 0, color: '#FF4444' },
    { name: 'Rescheduled', value: stats.find(s => s.status === 'rescheduled')?.count || 0, color: '#121212' },
  ].filter(d => d.value > 0);

  const total = statusData.reduce((acc, curr) => acc + curr.value, 0);
  const adherence = total > 0 ? Math.round((statusData[0].value / total) * 100) : 0;

  // Mock data for Radar chart (since we don't have multi-variable data in this simple app yet)
  const radarData = [
    { subject: 'Morning', A: 120, fullMark: 150 },
    { subject: 'Afternoon', A: 98, fullMark: 150 },
    { subject: 'Evening', A: 86, fullMark: 150 },
    { subject: 'Night', A: 99, fullMark: 150 },
    { subject: 'Weekend', A: 85, fullMark: 150 },
    { subject: 'Weekday', A: 65, fullMark: 150 },
  ];

  return (
    <div className="min-h-screen bg-soft-bg pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <h1 className="text-4xl font-heading font-bold mb-8">Monthly Report</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-dark-surface text-white border-none shadow-[6px_6px_0px_0px_rgba(212,255,94,1)]">
            <CardHeader>
              <CardTitle className="text-lime-brand font-mono text-sm uppercase tracking-wider">Adherence Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-mono-num font-bold">{adherence}%</div>
              <p className="text-sm text-gray-400 mt-2">Compliance Rate</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-500 font-mono text-sm uppercase tracking-wider">Total Doses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-mono-num font-bold text-black">{statusData[0]?.value || 0}</div>
              <p className="text-sm text-gray-500 mt-2">Successfully Taken</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-500 font-mono text-sm uppercase tracking-wider">Missed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-mono-num font-bold text-red-500">{statusData[1]?.value || 0}</div>
              <p className="text-sm text-gray-500 mt-2">Doses Missed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[400px] bg-white">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-[400px] bg-white">
            <CardHeader>
              <CardTitle>Activity Radar</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#121212', fontSize: 12, fontFamily: 'Inter' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#121212"
                    strokeWidth={2}
                    fill="#D4FF5E"
                    fillOpacity={0.6}
                  />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
