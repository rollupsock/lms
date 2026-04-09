import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Classes() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;

    // Generate a simple 6-char code
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-stone-200 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center justify-between">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
