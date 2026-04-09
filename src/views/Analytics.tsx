import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, BookOpen, TrendingUp, Award, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">{t('analytics')}</h1>
          <p className="text-stone-500">Comprehensive overview of school performance and student engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-stone-200">
            <Filter size={16} /> Filter
          </Button>
          <Button className="gap-2 bg-stone-900 hover:bg-stone-800 text-white">
            <Download size={16} /> Export Report
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Enrollment Growth" value="+12%" trend="up" icon={<TrendingUp size={20} />} />
        <MetricCard title="Avg. Grade" value="88.4" trend="up" icon={<Award size={20} />} />
        <MetricCard title="Active Students" value="1,240" trend="up" icon={<Users size={20} />} />
        <MetricCard title="Course Completion" value="76%" trend="down" icon={<BookOpen size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrollment Trends */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Enrollment Trends</CardTitle>
            <CardDescription>Monthly student enrollments over the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Line type="monotone" dataKey="students" stroke="#44403c" strokeWidth={3} dot={{r: 4, fill: '#44403c'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Course Distribution</CardTitle>
            <CardDescription>Enrollments by course category</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 ml-4">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                  <span className="text-xs text-stone-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Table */}
      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Top Performing Courses</CardTitle>
          <CardDescription>Courses with the highest engagement and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-500">
              <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                <tr>
                  <th className="px-6 py-3 rounded-l-lg">Course Name</th>
                  <th className="px-6 py-3">Instructor</th>
                  <th className="px-6 py-3">Students</th>
                  <th className="px-6 py-3">Avg. Grade</th>
                  <th className="px-6 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr className="bg-white hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">Advanced Arabic Grammar</td>
                  <td className="px-6 py-4">Sheikh Ahmed</td>
                  <td className="px-6 py-4">124</td>
                  <td className="px-6 py-4">92%</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-none">Active</Badge></td>
                </tr>
                <tr className="bg-white hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">Introduction to Fiqh</td>
                  <td className="px-6 py-4">Ustadh Omar</td>
                  <td className="px-6 py-4">89</td>
                  <td className="px-6 py-4">85%</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-none">Active</Badge></td>
                </tr>
                <tr className="bg-white hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">Seerah of the Prophet</td>
                  <td className="px-6 py-4">Dr. Fatima</td>
                  <td className="px-6 py-4">210</td>
                  <td className="px-6 py-4">94%</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-none">Active</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string, value: string, trend: 'up' | 'down', icon: React.ReactNode }) {
  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
            {icon}
          </div>
          <Badge variant="ghost" className={cn(
            "text-xs font-bold",
            trend === 'up' ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
          )}>
            {trend === 'up' ? '↑' : '↓'} 4.2%
          </Badge>
        </div>
        <p className="text-sm text-stone-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

const enrollmentData = [
  { name: 'Jan', students: 400 },
  { name: 'Feb', students: 520 },
  { name: 'Mar', students: 680 },
  { name: 'Apr', students: 800 },
  { name: 'May', students: 750 },
  { name: 'Jun', students: 900 },
  { name: 'Jul', students: 1100 },
  { name: 'Aug', students: 1240 },
];

const categoryData = [
  { name: 'Quran', value: 35 },
  { name: 'Arabic', value: 25 },
  { name: 'Fiqh', value: 20 },
  { name: 'History', value: 15 },
  { name: 'Other', value: 5 },
];

const COLORS = ['#44403c', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4'];
