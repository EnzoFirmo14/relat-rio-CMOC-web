import React, { useEffect } from'react';
import { BrowserRouter, Routes, Route, Navigate } from'react-router-dom';
import { useSelector, useDispatch } from'react-redux';
import type { RootState } from'./store';
import { initTheme, setFirebaseUser } from'./store';
import { onAuthStateChanged } from'firebase/auth';
import { auth } from'./services/firebase';
import Login from'./pages/Login';
import Register from'./pages/Register';
import Dashboard from'./pages/Dashboard';
import ReportsList from'./pages/ReportsList';
import ReportForm from'./pages/ReportForm';
import ReportDetails from'./pages/ReportDetails';
import Placeholder from'./pages/Placeholder';
import Platforms from'./pages/Platforms';
import Telemetry from'./pages/Telemetry';
import GasMonitor from'./pages/GasMonitor';
import Settings from'./pages/Settings';
import DashboardLayout from'./layouts/DashboardLayout';

// Component to protect routes requiring authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
 const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
 
 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
 </div>
 );
 }
 
 if (!isAuthenticated) {
 return <Navigate to="/login"replace />;
 }

 return <>{children}</>;
}

// Component to redirect logged in users away from login page
function PublicRoute({ children }: { children: React.ReactNode }) {
 const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
 </div>
 );
 }

 if (isAuthenticated) {
 return <Navigate to="/dashboard"replace />;
 }

 return <>{children}</>;
}

function App() {
 const dispatch = useDispatch();

 useEffect(() => {
 // Initial theme set from Redux/LocalStorage
 dispatch(initTheme());

 // Listen to Firebase Auth state
 let unsubscribeProfile: (() => void) | undefined;

 const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Dispatch minimal user info to unlock the 'loading' screen immediately
      dispatch(setFirebaseUser({
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Carregando...',
        role: '...',
        avatarColor: '#3b82f6',
      }));

      try {
        const { getOrCreateUserProfile, subscribeToUserProfile } = await import('./services/profileService');
        
        // Ensure doc exists
        await getOrCreateUserProfile(user.uid, user.email);

        // Subscribe to real-time updates
        unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
          if (profile) {
            dispatch(setFirebaseUser({
              uid: profile.uid,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              photoURL: profile.photoURL,
              avatarColor: profile.avatarColor,
            }));
          }
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // We still have the minimal user state so the app doesn't break
      }
    } else {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      dispatch(setFirebaseUser(null));
    }
  });

  return () => {
    unsubscribe();
    if (unsubscribeProfile) {
      unsubscribeProfile();
    }
  };
 }, [dispatch]);

 return (
 <BrowserRouter>
 <Routes>
 {/* Public Routes */}
 <Route 
 path="/login"
 element={
 <PublicRoute>
 <Login />
 </PublicRoute>
 } 
 />

 <Route 
 path="/register"
 element={
 <PublicRoute>
 <Register />
 </PublicRoute>
 } 
 />

 {/* Protected Routes inside DashboardLayout */}
 <Route 
 path="/dashboard"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <Dashboard />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/reports"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <ReportsList />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/reports/new"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <ReportForm />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/reports/edit/:id"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <ReportForm />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/reports/:id"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <ReportDetails />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 {/* Specific functional pages */}
 <Route 
 path="/other/equipments"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <Platforms />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/other/telemetry"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <Telemetry />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/other/gas-monitor"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <GasMonitor />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 <Route 
 path="/other/settings"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <Settings />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 {/* Placeholder pages to make sure no menu is non-functional */}
 <Route 
 path="/other/:page"
 element={
 <ProtectedRoute>
 <DashboardLayout>
 <Placeholder />
 </DashboardLayout>
 </ProtectedRoute>
 } 
 />

 {/* Fallbacks */}
 <Route path="/"element={<Navigate to="/dashboard"replace />} />
 <Route path="*"element={<Navigate to="/dashboard"replace />} />
 </Routes>
 </BrowserRouter>
 );
}

export default App;
