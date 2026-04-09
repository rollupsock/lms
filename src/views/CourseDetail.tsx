import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Video, 
  CheckCircle2, 
  ChevronRight,
  ArrowLeft,
  Clock,
  Award,
  HelpCircle,
  Send,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

import { ResourceList, Resource } from '../components/ResourceList';
import { ResourceForm } from '../components/ResourceForm';

export default function CourseDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isSyllabusDialogOpen, setIsSyllabusDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: '', type: 'video', duration: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', maxPoints: 100, resources: [] as Resource[] });

  useEffect(() => {
    async function fetchData() {
      if (!id || !user) return;

      // Profile
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      setProfile(profileSnap.data());

      // Course
      const courseSnap = await getDoc(doc(db, 'courses', id));
      if (courseSnap.exists()) {
        setCourse({ id: courseSnap.id, ...courseSnap.data() });
      }

      // Assignments
      const assignmentsQuery = query(collection(db, 'assignments'), where('courseId', '==', id));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Quizzes
      const quizzesQuery = query(collection(db, 'quizzes'), where('courseId', '==', id));
      const quizzesSnap = await getDocs(quizzesQuery);
      setQuizzes(quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Enrollment
      const enrollmentsQuery = query(
        collection(db, 'enrollments'), 
        where('studentId', '==', user.uid),
        where('courseId', '==', id)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      if (!enrollmentsSnap.empty) {
        setEnrollment({ id: enrollmentsSnap.docs[0].id, ...enrollmentsSnap.docs[0].data() });
      }

      setLoading(false);
    }
    fetchData();

    // Real-time comments
    const qComments = query(collection(db, 'comments'), where('courseId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qComments, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addDoc(collection(db, 'comments'), {
        courseId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) return;
    const updatedSyllabus = [...(course.syllabus || []), { ...newLesson, completed: false }];
    try {
      await updateDoc(doc(db, 'courses', id!), { syllabus: updatedSyllabus });
      setCourse({ ...course, syllabus: updatedSyllabus });
      setNewLesson({ title: '', type: 'video', duration: '' });
      setIsSyllabusDialogOpen(false);
      toast.success('Lesson added');
    } catch (error) {
      toast.error('Failed to add lesson');
    }
  };

  const handleDeleteLesson = async (index: number) => {
    const updatedSyllabus = course.syllabus.filter((_: any, i: number) => i !== index);
    try {
      await updateDoc(doc(db, 'courses', id!), { syllabus: updatedSyllabus });
      setCourse({ ...course, syllabus: updatedSyllabus });
      toast.success('Lesson removed');
    } catch (error) {
      toast.error('Failed to remove lesson');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      toast.success('Assignment deleted');
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      toast.success('Quiz deleted');
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) return;
    try {
      const docRef = await addDoc(collection(db, 'assignments'), {
        ...newAssignment,
        courseId: id,
        teacherId: user?.uid,
        dueDate: new Date(newAssignment.dueDate),
        createdAt: serverTimestamp()
      });
      setAssignments([...assignments, { id: docRef.id, ...newAssignment, dueDate: { seconds: new Date(newAssignment.dueDate).getTime() / 1000 } }]);
      setNewAssignment({ title: '', description: '', dueDate: '', maxPoints: 100, resources: [] });
      setIsAssignmentDialogOpen(false);
      toast.success('Assignment created');
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleAddResource = async (resource: Resource) => {
    try {
      const updatedResources = [...(course.resources || []), resource];
      await updateDoc(doc(db, 'courses', id!), {
        resources: updatedResources
      });
      setCourse({ ...course, resources: updatedResources });
      toast.success('Resource added');
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  const handleDeleteResource = async (index: number) => {
    try {
      const updatedResources = [...(course.resources || [])];
      updatedResources.splice(index, 1);
      await updateDoc(doc(db, 'courses', id!), {
        resources: updatedResources
      });
      setCourse({ ...course, resources: updatedResources });
      toast.success('Resource removed');
    } catch (error) {
      toast.error('Failed to remove resource');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;
  if (!course) return <div>Course not found</div>;

  const syllabus = course.syllabus || [
    { title: 'Introduction to the Course', type: 'video', duration: '15m', completed: true },
    { title: 'Foundational Concepts', type: 'reading', duration: '30m', completed: true },
    { title: 'Practical Application I', type: 'video', duration: '45m', completed: false },
    { title: 'Mid-term Review', type: 'reading', duration: '20m', completed: false },
    { title: 'Advanced Topics', type: 'video', duration: '60m', completed: false },
  ];

  const isInstructor = profile?.role === 'admin' || (profile?.role === 'teacher' && course.teacherId === user?.uid);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button */}
      <Button variant="ghost" render={<Link to="/courses" />} nativeButton={false} className="text-stone-500 hover:text-stone-900 -ml-4">
        <ArrowLeft size={18} className="mr-2" />
        Back to Courses
      </Button>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-stone-200">
                {course.category || 'General'}
              </Badge>
              <span className="text-stone-400 text-sm flex items-center gap-1">
                <Clock size={14} /> 12 Weeks
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">
              {course.description}
            </p>
          </div>

          <Tabs defaultValue="syllabus" className="w-full">
            <TabsList className="bg-stone-100 p-1 rounded-xl w-full justify-start mb-6 overflow-x-auto">
              <TabsTrigger value="syllabus" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Syllabus
              </TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Resources
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="discussions" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Discussions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="syllabus" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif font-bold">Course Content</h3>
                {isInstructor && (
                  <Dialog open={isSyllabusDialogOpen} onOpenChange={setIsSyllabusDialogOpen}>
                    <DialogTrigger render={<Button size="sm" className="bg-stone-900 text-white gap-2" />}>
                      <Plus size={16} />
                      Add Lesson
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Lesson</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Lesson Title</label>
                          <Input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Type</label>
                          <select 
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newLesson.type}
                            onChange={e => setNewLesson({...newLesson, type: e.target.value})}
                          >
                            <option value="video">Video</option>
                            <option value="reading">Reading</option>
                            <option value="quiz">Quiz</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Duration (e.g. 15m)</label>
                          <Input value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSyllabusDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddLesson} className="bg-stone-900 text-white">Add Lesson</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {syllabus.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-400 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                      {item.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-500">{item.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <ChevronRight className="text-stone-300 group-hover:text-stone-900 transition-colors" size={20} />
                    )}
                    {isInstructor && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-300 hover:text-red-600" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(index);
                      }}>
                        <Trash size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif font-bold">Assignments</h3>
                {isInstructor && (
                  <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                    <DialogTrigger render={<Button size="sm" className="bg-stone-900 text-white gap-2" />}>
                      <Plus size={16} />
                      New Assignment
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Assignment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <textarea 
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newAssignment.description}
                            onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Points</Label>
                            <Input type="number" value={newAssignment.maxPoints} onChange={e => setNewAssignment({...newAssignment, maxPoints: parseInt(e.target.value)})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Resources</Label>
                          <ResourceForm onAdd={(res) => setNewAssignment({...newAssignment, resources: [...newAssignment.resources, res]})} />
                          <ResourceList 
                            resources={newAssignment.resources} 
                            isEditable={true} 
                            onDelete={(idx) => {
                              const updated = [...newAssignment.resources];
                              updated.splice(idx, 1);
                              setNewAssignment({...newAssignment, resources: updated});
                            }} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddAssignment} className="bg-stone-900 text-white">Create Assignment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <Card key={assignment.id} className="border-stone-200 shadow-sm hover:shadow-md transition-shadow relative">
                    {isInstructor && (
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteAssignment(assignment.id)} className="text-red-600">
                              <Trash size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-serif">{assignment.title}</CardTitle>
                      <Badge variant="outline" className="text-stone-500">
                        {assignment.maxPoints} pts
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-stone-600">{assignment.description}</p>
                      
                      {assignment.resources && assignment.resources.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Resources</p>
                          <ResourceList resources={assignment.resources} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-stone-400">Due: {new Date(assignment.dueDate?.seconds * 1000 || assignment.dueDate).toLocaleDateString()}</span>
                        <Button variant="outline" size="sm" className="border-stone-200 hover:bg-stone-50">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <ClipboardList className="mx-auto w-10 h-10 text-stone-300 mb-2" />
                  <p className="text-stone-500">No assignments posted yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-stone-900">Course Resources</h3>
              </div>
              
              {isInstructor && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-stone-700">Add New Resource</h4>
                  <ResourceForm onAdd={handleAddResource} />
                </div>
              )}

              <div className="pt-4">
                <ResourceList 
                  resources={course.resources || []} 
                  isEditable={isInstructor}
                  onDelete={handleDeleteResource}
                />
              </div>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <Card key={quiz.id} className="border-stone-200 shadow-sm relative">
                    {isInstructor && (
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteQuiz(quiz.id)} className="text-red-600">
                              <Trash size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-800">
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-stone-900">{quiz.title}</h3>
                          <p className="text-xs text-stone-500">{quiz.questions?.length} Questions</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-stone-200">Start Quiz</Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <HelpCircle className="mx-auto w-10 h-10 text-stone-300 mb-2" />
                  <p className="text-stone-500">No quizzes available yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discussions" className="space-y-6">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input 
                  placeholder="Ask a question or share a thought..." 
                  className="border-stone-200"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <Button type="submit" className="bg-stone-900 text-white">
                  <Send size={18} />
                </Button>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-stone-100 text-stone-600 text-xs">
                        {comment.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-stone-50 rounded-2xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-stone-900">{comment.userName}</span>
                        <span className="text-[10px] text-stone-400">
                          {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-sm">
                    No discussions yet. Be the first to ask a question!
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-stone-200 shadow-lg overflow-hidden">
            <img 
              src={course.thumbnail || `https://picsum.photos/seed/${course.id}/400/250`} 
              alt={course.title} 
              className="w-full h-48 object-cover"
              referrerPolicy="no-referrer"
            />
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-stone-600">Your Progress</span>
                  <span className="text-stone-900">{enrollment?.progress || 0}%</span>
                </div>
                <Progress value={enrollment?.progress || 0} className="h-2 bg-stone-100" />
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <BookOpen size={18} className="text-stone-400" />
                  <span>15 Lessons</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <ClipboardList size={18} className="text-stone-400" />
                  <span>5 Assignments</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <Award size={18} className="text-stone-400" />
                  <span>Certificate of Completion</span>
                </div>
              </div>

              <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white h-12 rounded-xl shadow-lg">
                Continue Lesson
              </Button>
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm bg-stone-50">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Instructor</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                {course.teacherName?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-stone-900">{course.teacherName}</p>
                <p className="text-xs text-stone-500">Senior Educator</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
