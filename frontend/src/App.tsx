import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ProtectedRoute } from './components/common';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TimelinePage from './pages/TimelinePage';
import ProfilePage from './pages/ProfilePage';
import OfficialProfilePage from './pages/OfficialProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ExplorePage from './pages/ExplorePage';
import MessagesPage from './pages/MessagesPage';
import PostDetailsPage from './pages/PostDetailsPage';
import IssueDetailsPage from './pages/IssueDetailsPage';
import OfficialDashboard from './pages/OfficialDashboard';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('Google Client ID not configured. Google OAuth will not work.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<TimelinePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/official/:id" element={<OfficialProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/post/:id" element={<PostDetailsPage />} />
            <Route path="/issue/:id" element={<IssueDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route element={<ProtectedRoute requireOfficial />}>
            <Route path="/dashboard/official" element={<OfficialDashboard />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
