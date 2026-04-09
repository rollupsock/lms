import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Copy, Check, Trash, UserMinus, ChevronDown, ChevronUp, UserPlus, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ResourceList, Resource } from '../components/ResourceList';
import { ResourceForm } from '../components/ResourceForm';

export default function Classes() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [newClassBanner, setNewClassBanner] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Record<string, any[]>>({});

  // Registration state
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [registeringClassId, setRegisteringClassId] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    displayName: '',
    age: '',
    gender: 'male',
    parentName: '',
    contactNumber: '',
    address: ''
  });

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
        bannerUrl: newClassBanner || `https://picsum.photos/seed/${code}/800/200`,
        resources: [],
        createdAt: serverTimestamp()
      });
      setClasses([...classes, { id: docRef.id, name: newClassName, code, teacherId: user.uid, bannerUrl: newClassBanner || `https://picsum.photos/seed/${code}/800/200`, resources: [] }]);
      setNewClassName('');
      setNewClassBanner('');
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

  const handleRegisterStudent = async () => {
    if (!newStudent.displayName || !registeringClassId) {
      toast.error('Student name is required');
      return;
    }

    const classObj = classes.find(c => c.id === registeringClassId);
    if (!classObj) return;

    try {
      const studentId = `manual_${Date.now()}`;
      await setDoc(doc(db, 'users', studentId), {
        uid: studentId,
        displayName: newStudent.displayName,
        role: 'student',
        classCode: classObj.code,
        age: parseInt(newStudent.age) || null,
        gender: newStudent.gender,
        parentName: newStudent.parentName,
        contactNumber: newStudent.contactNumber,
        address: newStudent.address,
        createdAt: serverTimestamp()
      });

      const studentData = { id: studentId, ...newStudent, classCode: classObj.code };
      setStudents(prev => ({
        ...prev,
        [registeringClassId]: [...(prev[registeringClassId] || []), studentData]
      }));

      setIsRegisterDialogOpen(false);
      setNewStudent({
        displayName: '',
        age: '',
        gender: 'male',
        parentName: '',
        contactNumber: '',
        address: ''
      });
      toast.success('Student registered successfully');
    } catch (error) {
      toast.error('Failed to register student');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddResource = async (classId: string, resource: Resource) => {
    try {
      const cls = classes.find(c => c.id === classId);
      const updatedResources = [...(cls.resources || []), resource];
      await updateDoc(doc(db, 'classes', classId), {
        resources: updatedResources
      });
      setClasses(classes.map(c => c.id === classId ? { ...c, resources: updatedResources } : c));
      toast.success('Resource added to class');
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  const handleDeleteResource = async (classId: string, index: number) => {
    try {
      const cls = classes.find(c => c.id === classId);
      const updatedResources = [...(cls.resources || [])];
      updatedResources.splice(index, 1);
      await updateDoc(doc(db, 'classes', classId), {
        resources: updatedResources
      });
      setClasses(classes.map(c => c.id === classId ? { ...c, resources: updatedResources } : c));
      toast.success('Resource removed');
    } catch (error) {
      toast.error('Failed to remove resource');
    }
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
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input 
                  id="className" 
                  placeholder="e.g., Grade 5 - Quranic Studies" 
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classBanner">Banner Image URL (Optional)</Label>
                <Input 
                  id="classBanner" 
                  placeholder="https://..." 
                  value={newClassBanner}
                  onChange={e => setNewClassBanner(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-stone-900 text-white gap-2 h-10">
                <Plus size={18} />
                Create Class
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {cls.bannerUrl && (
              <div className="h-32 w-full overflow-hidden">
                <img src={cls.bannerUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-stone-600 border-stone-200 gap-2"
                    onClick={() => {
                      setRegisteringClassId(cls.id);
                      setIsRegisterDialogOpen(true);
                    }}
                  >
                    <UserPlus size={16} />
                    Register
                  </Button>
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
                <div className="border-t border-stone-100 bg-stone-50/50 p-6 animate-in slide-in-from-top-2 duration-300 space-y-8">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-4">Class Resources</h4>
                    <div className="space-y-4">
                      <ResourceForm onAdd={(res) => handleAddResource(cls.id, res)} />
                      <ResourceList 
                        resources={cls.resources || []} 
                        isEditable={true} 
                        onDelete={(idx) => handleDeleteResource(cls.id, idx)} 
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-4">Enrolled Students</h4>
                    {students[cls.id]?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {students[cls.id].map((student: any) => (
                        <div key={student.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-sm font-bold">
                                {student.displayName?.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-stone-800 block">{student.displayName}</span>
                                <span className="text-[10px] text-stone-400 uppercase tracking-wider">{student.gender} • {student.age || '?'} yrs</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-stone-300 hover:text-red-600"
                              onClick={() => handleRemoveStudent(student.id, cls.id)}
                            >
                              <UserMinus size={16} />
                            </Button>
                          </div>
                          
                          {(student.parentName || student.contactNumber) && (
                            <div className="pt-3 border-t border-stone-50 space-y-2">
                              {student.parentName && (
                                <div className="flex items-center gap-2 text-xs text-stone-500">
                                  <UserIcon size={12} className="text-stone-300" />
                                  <span>Parent: <span className="font-medium text-stone-700">{student.parentName}</span></span>
                                </div>
                              )}
                              {student.contactNumber && (
                                <div className="flex items-center gap-2 text-xs text-stone-500">
                                  <Phone size={12} className="text-stone-300" />
                                  <span>Contact: <span className="font-medium text-stone-700">{student.contactNumber}</span></span>
                                </div>
                              )}
                              {student.address && (
                                <div className="flex items-center gap-2 text-xs text-stone-500">
                                  <MapPin size={12} className="text-stone-300" />
                                  <span className="truncate">{student.address}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 text-center py-4 italic">No students joined yet.</p>
                  )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Register Student Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Register New Student</DialogTitle>
            <DialogDescription>
              Add student details manually to enroll them in this class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Full Name</Label>
              <Input 
                id="name" 
                className="col-span-3" 
                value={newStudent.displayName}
                onChange={e => setNewStudent({...newStudent, displayName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">Age</Label>
              <Input 
                id="age" 
                type="number"
                className="col-span-3" 
                value={newStudent.age}
                onChange={e => setNewStudent({...newStudent, age: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">Gender</Label>
              <Select 
                value={newStudent.gender} 
                onValueChange={(val) => setNewStudent({...newStudent, gender: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">Parent Name</Label>
              <Input 
                id="parent" 
                className="col-span-3" 
                value={newStudent.parentName}
                onChange={e => setNewStudent({...newStudent, parentName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">Contact #</Label>
              <Input 
                id="contact" 
                className="col-span-3" 
                value={newStudent.contactNumber}
                onChange={e => setNewStudent({...newStudent, contactNumber: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input 
                id="address" 
                className="col-span-3" 
                value={newStudent.address}
                onChange={e => setNewStudent({...newStudent, address: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegisterStudent} className="bg-stone-900 text-white">Register Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
