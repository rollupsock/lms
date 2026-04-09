import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GraduationCap, Key, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export default function Login() {
  const { t } = useTranslation();
  const [studentName, setStudentName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Google login failed');
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !classCode) {
      toast.error('Please enter both name and class code');
      return;
    }

    setLoading(true);
    try {
      // Verify class code
      const q = query(collection(db, 'classes'), where('code', '==', classCode));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid class code');
        setLoading(false);
        return;
      }

      // Sign in anonymously
      let cred;
      try {
        cred = await signInAnonymously(auth);
      } catch (authError: any) {
        console.error('Anonymous auth failed:', authError);
        if (authError.code === 'auth/operation-not-allowed') {
          toast.error('Student login is currently disabled. Please contact the administrator.');
        } else {
          toast.error('Authentication failed: ' + authError.message);
        }
        setLoading(false);
        return;
      }
      
      // Create user profile
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          displayName: studentName,
          role: 'student',
          classCode: classCode,
          createdAt: serverTimestamp()
        });
      } catch (dbError: any) {
        console.error('Profile creation failed:', dbError);
        toast.error('Failed to create student profile: ' + dbError.message);
        setLoading(false);
        return;
      }

      toast.success('Welcome, ' + studentName);
    } catch (error: any) {
      console.error('Student login failed:', error);
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-stone-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-300 rounded-full blur-[120px]" />
      </div>

      <Card className="max-w-md w-full border-stone-200 shadow-2xl relative z-10 overflow-hidden">
        <div className="h-2 bg-stone-800 w-full" />
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <GraduationCap className="w-10 h-10 text-stone-800" />
          </div>
          <CardTitle className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Madrassa Fikriyya
          </CardTitle>
          <CardDescription className="text-stone-500 mt-2">
            Empowering the next generation of Islamic thinkers
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-stone-100 p-1 rounded-xl">
              <TabsTrigger value="google" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Teacher/Parent
              </TabsTrigger>
              <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Student
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-4">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('sign_in_google')}
              </Button>
            </TabsContent>

            <TabsContent value="student" className="space-y-4">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-stone-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <Input 
                      id="name"
                      placeholder="Enter your name" 
                      className="pl-10 border-stone-200 focus:ring-stone-800"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-stone-700">Class Code</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <Input 
                      id="code"
                      placeholder="Enter class code" 
                      className="pl-10 border-stone-200 focus:ring-stone-800"
                      value={classCode}
                      onChange={e => setClassCode(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-lg"
                >
                  {loading ? 'Joining...' : 'Join Class'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <p className="text-center text-xs text-stone-400 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
