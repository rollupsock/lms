import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResourceList } from '../components/ResourceList';

export default function Assignments() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profileData = profileSnap.data();
      setProfile(profileData);

      let q;
      if (profileData?.role === 'student') {
        // For students, fetch assignments from enrolled courses
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid)));
        const courseIds = enrollmentsSnap.docs.map(d => d.data().courseId);
        
        if (courseIds.length > 0) {
          q = query(collection(db, 'assignments'), where('courseId', 'in', courseIds));
        }
      } else if (profileData?.role === 'teacher') {
        q = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
      } else {
        q = collection(db, 'assignments');
      }

      if (q) {
        const snap = await getDocs(q);
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">{t('assignments')}</h1>
          <p className="text-stone-500">Track your tasks and submissions across all courses.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-stone-100 p-1 rounded-xl w-full md:w-auto justify-start mb-6">
          <TabsTrigger value="pending" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Pending
          </TabsTrigger>
          <TabsTrigger value="submitted" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Submitted
          </TabsTrigger>
          <TabsTrigger value="graded" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Graded
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.length > 0 ? (
            assignments.map(assignment => (
              <div key={assignment.id}>
                <AssignmentCard assignment={assignment} status="pending" />
              </div>
            ))
          ) : (
            <EmptyState icon={<ClipboardList />} message="No pending assignments." />
          )}
        </TabsContent>

        <TabsContent value="submitted" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptyState icon={<CheckCircle2 />} message="No submitted assignments yet." />
        </TabsContent>

        <TabsContent value="graded" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptyState icon={<FileText />} message="No graded assignments yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentCard({ assignment, status }: { assignment: any, status: string }) {
  return (
    <Card className="border-stone-200 shadow-sm hover:shadow-md transition-all group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-stone-500 border-stone-200">
            {assignment.courseName || 'Course'}
          </Badge>
          {status === 'pending' && (
            <span className="text-red-500 flex items-center gap-1 text-xs font-medium">
              <AlertCircle size={12} /> Due soon
            </span>
          )}
        </div>
        <CardTitle className="text-lg font-serif group-hover:text-stone-700 transition-colors">
          {assignment.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-stone-600 line-clamp-2">
          {assignment.description}
        </p>

        {assignment.resources && assignment.resources.length > 0 && (
          <div className="pt-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Resources</p>
            <ResourceList resources={assignment.resources} />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-50">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Clock size={14} />
            <span>Due {new Date(assignment.dueDate?.seconds * 1000 || assignment.dueDate).toLocaleDateString()}</span>
          </div>
          <Button size="sm" className="bg-stone-900 hover:bg-stone-800 text-white rounded-lg">
            View Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-stone-200">
      <div className="mx-auto w-12 h-12 text-stone-200 mb-4">
        {icon}
      </div>
      <p className="text-stone-500 font-medium">{message}</p>
    </div>
  );
}
