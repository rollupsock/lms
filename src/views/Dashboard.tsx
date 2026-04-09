import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Clock, 
  Calendar as CalendarIcon,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      // Fetch Profile
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profileData = profileSnap.data();
      setProfile(profileData);

      // Fetch Stats based on role
      if (profileData?.role === 'student') {
        const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        setStats({
          activeCourses: enrollmentsSnap.size,
          avgProgress: enrollmentsSnap.docs.reduce((acc, doc) => acc + (doc.data().progress || 0), 0) / (enrollmentsSnap.size || 1),
          completedAssignments: 0, // Placeholder
        });
      } else if (profileData?.role === 'teacher') {
        const coursesQuery = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
        const coursesSnap = await getDocs(coursesQuery);
        setStats({
          totalCourses: coursesSnap.size,
          totalStudents: 0, // Placeholder
          pendingGrading: 0, // Placeholder
        });
      } else if (profileData?.role === 'admin') {
        const usersSnap = await getDocs(collection(db, 'users'));
        const coursesSnap = await getDocs(collection(db, 'courses'));
        setStats({
          totalStudents: usersSnap.docs.filter(d => d.data().role === 'student').length,
          totalTeachers: usersSnap.docs.filter(d => d.data().role === 'teacher').length,
          totalCourses: coursesSnap.size,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            {t('welcome')}, {profile?.displayName || user?.displayName}
          </h1>
          <p className="text-stone-500 mt-1">
            {profile?.role === 'student' 
              ? `Active in class: ${profile?.classCode || 'General'}`
              : "Here's what's happening at Madrassa Fikriyya today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-stone-100 text-stone-700 border-stone-200 px-3 py-1">
            <Clock size={14} className="mr-2" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {profile?.role === 'student' && (
          <>
            <StatCard icon={<BookOpen />} title="Active Courses" value={stats.activeCourses} color="bg-blue-50 text-blue-600" />
            <StatCard icon={<TrendingUp />} title="Avg. Progress" value={`${Math.round(stats.avgProgress)}%`} color="bg-green-50 text-green-600" />
            <StatCard icon={<ClipboardList />} title="Assignments" value="12" color="bg-amber-50 text-amber-600" />
            <StatCard icon={<Award />} title="Certificates" value="2" color="bg-purple-50 text-purple-600" />
          </>
        )}
        {profile?.role === 'teacher' && (
          <>
            <StatCard icon={<BookOpen />} title="My Courses" value={stats.totalCourses} color="bg-blue-50 text-blue-600" />
            <StatCard icon={<Users />} title="Total Students" value="45" color="bg-green-50 text-green-600" />
            <StatCard icon={<ClipboardList />} title="Pending Grading" value="8" color="bg-amber-50 text-amber-600" />
            <StatCard icon={<CalendarIcon />} title="Upcoming Exams" value="3" color="bg-purple-50 text-purple-600" />
          </>
        )}
        {profile?.role === 'admin' && (
          <>
            <StatCard icon={<Users />} title="Total Students" value={stats.totalStudents} color="bg-blue-50 text-blue-600" />
            <StatCard icon={<Users />} title="Total Teachers" value={stats.totalTeachers} color="bg-green-50 text-green-600" />
            <StatCard icon={<BookOpen />} title="Total Courses" value={stats.totalCourses} color="bg-amber-50 text-amber-600" />
            <StatCard icon={<TrendingUp />} title="Revenue" value="$12.4k" color="bg-purple-50 text-purple-600" />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts / Activity */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-lg font-serif">Learning Activity</CardTitle>
              <CardDescription>Hours spent learning over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                    />
                    <Bar dataKey="hours" fill="#44403c" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Recent Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnnouncementItem title="Ramadan Schedule Update" date="2 days ago" type="important" />
                <AnnouncementItem title="New Quran Recitation Course" date="5 days ago" type="new" />
                <AnnouncementItem title="Parent-Teacher Meeting" date="1 week ago" type="event" />
              </CardContent>
            </Card>

            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TaskItem title="Arabic Grammar Quiz" due="Tomorrow" priority="high" />
                <TaskItem title="Fiqh Assignment" due="In 3 days" priority="medium" />
                <TaskItem title="Seerah Presentation" due="Next week" priority="low" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-8">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">My Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressItem title="Arabic Level 1" progress={75} />
              <ProgressItem title="Quran Tajweed" progress={40} />
              <ProgressItem title="Islamic History" progress={90} />
            </CardContent>
          </Card>

          <Card className="bg-stone-900 text-stone-100 border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-stone-100">Daily Verse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-serif italic leading-relaxed text-stone-200">
                "Read! In the name of your Lord who created..."
              </p>
              <p className="mt-4 text-sm text-stone-400">— Surah Al-Alaq, 96:1</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: any, color: string }) {
  return (
    <Card className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", color)}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-stone-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressItem({ title, progress }: { title: string, progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-stone-700">{title}</span>
        <span className="text-stone-500">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2 bg-stone-100" />
    </div>
  );
}

function AnnouncementItem({ title, date, type }: { title: string, date: string, type: string }) {
  const colors = {
    important: "bg-red-100 text-red-700",
    new: "bg-green-100 text-green-700",
    event: "bg-blue-100 text-blue-700"
  };
  return (
    <div className="flex items-start gap-3">
      <div className={cn("w-2 h-2 mt-2 rounded-full", type === 'important' ? 'bg-red-500' : 'bg-stone-300')} />
      <div>
        <p className="text-sm font-medium text-stone-800">{title}</p>
        <p className="text-xs text-stone-500">{date}</p>
      </div>
    </div>
  );
}

function TaskItem({ title, due, priority }: { title: string, due: string, priority: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-1.5 h-8 rounded-full",
          priority === 'high' ? 'bg-red-400' : priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
        )} />
        <div>
          <p className="text-sm font-medium text-stone-800">{title}</p>
          <p className="text-xs text-stone-500">Due {due}</p>
        </div>
      </div>
      <Badge variant="ghost" className="text-[10px] uppercase tracking-wider text-stone-400">
        {priority}
      </Badge>
    </div>
  );
}

const activityData = [
  { name: 'Mon', hours: 2 },
  { name: 'Tue', hours: 4 },
  { name: 'Wed', hours: 3 },
  { name: 'Thu', hours: 5 },
  { name: 'Fri', hours: 1 },
  { name: 'Sat', hours: 6 },
  { name: 'Sun', hours: 4 },
];
