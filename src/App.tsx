/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './i18n';

import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Courses from './views/Courses';
import CourseDetail from './views/CourseDetail';
import Assignments from './views/Assignments';
import CalendarView from './views/Calendar';
import Messages from './views/Messages';
import Analytics from './views/Analytics';
import QuizMaker from './views/QuizMaker';
import Classes from './views/Classes';

export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/quiz-maker" element={<QuizMaker />} />
            <Route path="/classes" element={<Classes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </TooltipProvider>
  );
}

