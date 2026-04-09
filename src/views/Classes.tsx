import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Copy, Check, Trash, UserMinus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function Classes() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Record<string, any[]>>({});

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const snap = await getDocs(q);
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchClasses();
  }, [user]);

  const fetchStudents = async (classCode: string, classId: string) => {
    if (students[classId]) return;
    const q = query(collection(db, 'users'), where('classCode', '==', classCode), where('role', '==', 'student'));
    const snap = await getDocs(q);
    setStudents(prev => ({ ...prev, [classId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
  };

  const toggleExpand = (cls: any) => {
    if (expandedClass === cls.id) {
      setExpandedClass(null);
    } else {
      setExpandedClass(cls.id);
      fetchStudents(cls.code, cls.id);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: newClassName,
        code,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      setClasses([...classes, { id: docRef.id, name: newClassName, code, teacherId: user.uid }]);
      setNewClassName('');
      toast.success('Class created successfully');
    } catch (error) {
      toast.error('Failed to create class');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class? Students will lose access.')) return;
    try {
      await deleteDoc(doc(db, 'classes', classId));
      setClasses(classes.filter(c => c.id !== classId));
      toast.success('Class deleted successfully');
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleRemoveStudent = async (studentId: string, classId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) return;
    try {
      await updateDoc(doc(db, 'users', studentId), {
        classCode: null
      });
      setStudents(prev => ({
        ...prev,
        [classId]: prev[classId].filter(s => s.id !== studentId)
      }));
      toast.success('Student removed from class');
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">My Classes</h1>
          <p className="text-stone-500">Manage your student groups and class codes.</p>
        </div>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Create New Class</CardTitle>
          <CardDescription>Students will use the generated code to join your class.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClass} className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input 
                id="className" 
                placeholder="e.g., Grade 5 - Quranic Studies" 
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="bg-stone-900 text-white gap-2 h-10">
                <Plus size={18} />
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-800">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">{cls.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-600">
                        {cls.code}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-stone-400 hover:text-stone-900"
                        onClick={() => copyToClipboard(cls.code)}
                      >
                        {copiedId === cls.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-stone-500" onClick={() => toggleExpand(cls)}>
                    {expandedClass === cls.id ? <ChevronUp size={18} className="mr-2" /> : <ChevronDown size={18} className="mr-2" />}
                    Students
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDeleteClass(cls.id)}>
                    <Trash size={18} />
                  </Button>
                </div>
              </div>

              {expandedClass === cls.id && (
                <div className="border-t border-stone-100 bg-stone-50/50 p-6 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-sm font-bold text-stone-900 mb-4">Enrolled Students</h4>
                  {students[cls.id]?.length > 0 ? (
                    <div className="space-y-3">
                      {students[cls.id].map((student) => (
                        <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-xs font-bold">
                              {student.displayName?.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-stone-800">{student.displayName}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-stone-400 hover:text-red-600"
                            onClick={() => handleRemoveStudent(student.id, cls.id)}
                          >
                            <UserMinus size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 text-center py-4 italic">No students joined yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
