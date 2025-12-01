import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import { CookieConsent } from './components/CookieConsent';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import DonationForm from "./components/DonationForm";
import ReportForm from "./components/ReportForm";
import ShowTest from "./components/ShowTest";

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Files = lazy(() => import('./pages/Files').then(module => ({ default: module.Files })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Voice = lazy(() => import('./pages/Voice').then(module => ({ default: module.Voice })));
const Privacy = lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(module => ({ default: module.Terms })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const FAQ = lazy(() => import('./pages/FAQ').then(module => ({ default: module.FAQ })));
const Donate = lazy(() => import('./pages/Donate').then(module => ({ default: module.Donate })));
const Share = lazy(() => import('./pages/Share').then(module => ({ default: module.Share })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <>
      <div className="flex flex-col gap-8">
      <DonationForm />
      <ReportForm />
    </div>
      <ShowTest />
      <GoogleAnalytics />
      <CookieConsent />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scan" element={<Dashboard />} />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Files />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/voice" element={<Voice />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/share/:id" element={<Share />} />
          <Route path="/show-test" element={<ShowTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;

