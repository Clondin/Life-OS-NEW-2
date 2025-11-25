import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useStore, hydrateStore } from './store/useStore';
import { ROUTES, COLLECTIONS } from './constants';
import { useDataSync } from './services/dataService';

// Pages
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Tasks } from './pages/Tasks';
import { Notes } from './pages/Notes';
import { Files } from './pages/Files';
import { Layout } from './components/Layout';

// Loading Spinner
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  
  // Wrap protected content in Layout and sync data
  return (
    <DataSyncWrapper>
      <Layout>{children}</Layout>
    </DataSyncWrapper>
  );
};

// Wrapper to trigger hooks only when authenticated
const DataSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useDataSync();
  return <>{children}</>;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { setUser } = useStore();

  useEffect(() => {
    // 1. Hydrate local state
    hydrateStore().then(() => {
        // 2. Check Auth
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Fetch extended user details
            try {
              const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
              if (userSnap.exists()) {
                setUser({ uid: firebaseUser.uid, ...userSnap.data() } as any);
              } else {
                // Fallback for just-created users or partial auth
                setUser({ 
                    uid: firebaseUser.uid, 
                    displayName: firebaseUser.displayName, 
                    email: firebaseUser.email, 
                    photoURL: firebaseUser.photoURL 
                } as any);
              }
            } catch (e) {
                console.error("Error fetching user details", e);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => unsubscribe();
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        
        <Route path={ROUTES.APP} element={<Navigate to={ROUTES.HOME} replace />} />
        
        <Route path={ROUTES.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={ROUTES.PROJECTS} element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path={ROUTES.PROJECT_DETAIL} element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path={ROUTES.TASKS} element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path={ROUTES.NOTES} element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path={ROUTES.FILES} element={<ProtectedRoute><Files /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;