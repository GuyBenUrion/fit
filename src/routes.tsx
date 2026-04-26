import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Login from '@/pages/Login';
import Today from '@/pages/Today';
import Schedule from '@/pages/Schedule';
import Log from '@/pages/Log';
import Routines from '@/pages/Routines';
import Exercises from '@/pages/Exercises';
import Assessment from '@/pages/Assessment';
import Profile from '@/pages/Profile';
import SessionRunner from '@/pages/SessionRunner';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/exercises" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/log" element={<Log />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/session" element={<SessionRunner />} />
      </Route>

      <Route path="*" element={<Navigate to="/exercises" replace />} />
    </Routes>
  );
}
