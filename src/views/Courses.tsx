import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, BookOpen, User, Clock, Filter, MoreVertical, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { deleteDoc } from 'firebase/firestore';

export default function Courses() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New/Edit Course Form
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '' });
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      // Profile
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      setProfile(profileSnap.data());

      // Courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Enrollments
      const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      setEnrollments(enrollmentsSnap.docs.map(doc => doc.data().courseId));

      setLoading(false);
    }
    fetchData();
  }, [user]);

  const handleCreateOrUpdateCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingCourse) {
        await setDoc(doc(db, 'courses', editingCourse.id), {
          ...newCourse,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...newCourse } : c));
        toast.success('Course updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'courses'), {
          ...newCourse,
          teacherId: user?.uid,
          teacherName: user?.displayName,
          createdAt: serverTimestamp(),
          thumbnail: `https://picsum.photos/seed/${newCourse.title}/400/250`
        });
        setCourses([{ id: docRef.id, ...newCourse, teacherName: user?.displayName, thumbnail: `https://picsum.photos/seed/${newCourse.title}/400/250` }, ...courses]);
        toast.success('Course created successfully');
      }
      setIsDialogOpen(false);
      setNewCourse({ title: '', description: '', category: '' });
      setEditingCourse(null);
    } catch (error) {
      toast.error('Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      setCourses(courses.filter(c => c.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const openEditDialog = (course: any) => {
    setEditingCourse(course);
    setNewCourse({ title: course.title, description: course.description, category: course.category });
    setIsDialogOpen(true);
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await addDoc(collection(db, 'enrollments'), {
        studentId: user?.uid,
        courseId,
        enrolledAt: serverTimestamp(),
        progress: 0,
        status: 'active'
      });
      setEnrollments([...enrollments, courseId]);
      toast.success('Enrolled successfully');
    } catch (error) {
      toast.error('Failed to enroll');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">{t('courses')}</h1>
          <p className="text-stone-500">Explore and manage educational programs at Madrassa Fikriyya.</p>
        </div>

        {(profile?.role === 'teacher' || profile?.role === 'admin') && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCourse(null);
              setNewCourse({ title: '', description: '', category: '' });
            }
          }}>
            <DialogTrigger render={<Button className="bg-stone-900 hover:bg-stone-800 text-white gap-2 w-full md:w-auto" />}>
              <Plus size={18} />
              {t('create_course')}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif">{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <CardDescription>{editingCourse ? 'Update the details of your course.' : 'Fill in the details to launch a new course.'}</CardDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Title</label>
                  <Input 
                    placeholder="e.g. Introduction to Arabic Grammar" 
                    value={newCourse.title}
                    onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    placeholder="e.g. Language, Fiqh, Seerah" 
                    value={newCourse.category}
                    onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Describe what students will learn..." 
                    className="min-h-[100px]"
                    value={newCourse.description}
                    onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleCreateOrUpdateCourse} className="bg-stone-900 hover:bg-stone-800 text-white w-full sm:w-auto">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="Search courses..." 
            className="pl-10 border-none focus-visible:ring-0 w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" className="text-stone-500 hidden sm:flex">
          <Filter size={18} />
        </Button>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="group border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative">
            {(profile?.role === 'admin' || (profile?.role === 'teacher' && course.teacherId === user?.uid)) && (
              <div className="absolute top-2 left-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="bg-white/80 backdrop-blur-sm hover:bg-white" />}>
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => openEditDialog(course)}>
                      <Edit size={14} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)} className="text-red-600">
                      <Trash size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={course.thumbnail || `https://picsum.photos/seed/${course.id}/400/250`} 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-stone-900 backdrop-blur-sm border-none">
                  {course.category || 'General'}
                </Badge>
              </div>
            </div>
            <CardHeader className="flex-1">
              <CardTitle className="text-xl font-serif line-clamp-1 group-hover:text-stone-700 transition-colors">
                {course.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-stone-500">
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>{course.teacherName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>12 Weeks</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-stone-50 bg-stone-50/50 p-4">
              {enrollments.includes(course.id) ? (
                <Button render={<Link to={`/courses/${course.id}`} />} className="w-full bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200">
                  Continue Learning
                </Button>
              ) : (
                <Button 
                  onClick={() => handleEnroll(course.id)} 
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white"
                  disabled={profile?.role === 'teacher' || profile?.role === 'admin'}
                >
                  {t('enroll')}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
          <BookOpen className="mx-auto w-12 h-12 text-stone-300 mb-4" />
          <h3 className="text-lg font-medium text-stone-900">No courses found</h3>
          <p className="text-stone-500">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
}
