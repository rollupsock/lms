import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCog, Baby } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectingRole, setSelectingRole] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
          setSelectingRole(false);
        } else {
          setSelectingRole(true);
        }
      }
      setProfileLoading(false);
    }
    fetchProfile();
  }, [user]);

  const handleRoleSelect = async (role: string) => {
    if (!user) return;
    const newProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setSelectingRole(false);
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (selectingRole) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-stone-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif text-stone-900">Welcome to Madrassa Fikriyya</CardTitle>
            <CardDescription className="text-stone-600">Please select your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RoleButton 
              icon={<GraduationCap className="w-8 h-8" />} 
              title="Student" 
              description="Enroll in courses and track your progress"
              onClick={() => handleRoleSelect('student')}
            />
            <RoleButton 
              icon={<Users className="w-8 h-8" />} 
              title="Teacher" 
              description="Create courses and manage students"
              onClick={() => handleRoleSelect('teacher')}
            />
            <RoleButton 
              icon={<Baby className="w-8 h-8" />} 
              title="Parent" 
              description="Monitor your children's learning journey"
              onClick={() => handleRoleSelect('parent')}
            />
            <RoleButton 
              icon={<UserCog className="w-8 h-8" />} 
              title="Admin" 
              description="Manage the entire school platform"
              onClick={() => handleRoleSelect('admin')}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function RoleButton({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-stone-100 border-stone-200 transition-all duration-300"
      onClick={onClick}
    >
      <div className="p-3 bg-stone-100 rounded-full text-stone-800">
        {icon}
      </div>
      <div className="text-center">
        <div className="font-bold text-lg text-stone-900">{title}</div>
        <div className="text-xs text-stone-500 max-w-[150px]">{description}</div>
      </div>
    </Button>
  );
}
