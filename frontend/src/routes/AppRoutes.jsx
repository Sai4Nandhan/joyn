import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import CreateActivity from '../pages/activities/CreateActivity.jsx';
import ActivityDetail from '../pages/activities/ActivityDetail.jsx';
import ActivityRoom from '../pages/activities/ActivityRoom.jsx';
import Profile from '../pages/profile/Profile.jsx';
import PublicProfile from '../pages/profile/PublicProfile.jsx';
import TripWorkspace from '../pages/activities/TripWorkspace.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import MyActivities from '../pages/activities/MyActivities.jsx';
import Rooms from '../pages/activities/Rooms.jsx';
import Messages from '../pages/profile/Messages.jsx';
import Trips from '../pages/activities/Trips.jsx';
import Notifications from '../pages/profile/Notifications.jsx';
import Friends from '../pages/profile/Friends.jsx';
import Badges from '../pages/profile/Badges.jsx';
import Saved from '../pages/activities/Saved.jsx';
import VerificationFlow from '../pages/verification/VerificationFlow.jsx';
import Settings from '../pages/profile/Settings.jsx';
import { Challenges } from '../pages/Challenges.jsx';
import { AdminRoute } from './AdminRoute.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/activities/new" element={<CreateActivity />} />
        <Route path="/activities/saved" element={<Saved />} />
        <Route path="/activities/:id/room" element={<ActivityRoom />} />
        <Route path="/activities/:id/workspace" element={<TripWorkspace />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verification" element={<VerificationFlow />} />
        <Route path="/users/:id" element={<PublicProfile />} />
        <Route path="/my-activities" element={<MyActivities />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>
      {/* Fallback public activity detail */}
      <Route path="/activities/:id" element={<ActivityDetail />} />
    </Routes>
  );
}

