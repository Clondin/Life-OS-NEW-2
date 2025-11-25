import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ROUTES, COLLECTIONS } from '../constants';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user doc exists
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 1. Create User
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. Create Default Workspace
        const wsRef = await addDoc(collection(db, COLLECTIONS.WORKSPACES), {
          name: "My Workspace",
          ownerId: user.uid,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 3. Create Membership (CRITICAL: Must match security rule ID format)
        const memberId = `${wsRef.id}_${user.uid}`;
        await setDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, memberId), {
          workspaceId: wsRef.id,
          userId: user.uid,
          role: 'owner',
          createdAt: serverTimestamp()
        });

        // 4. Create Default Project
        await addDoc(collection(db, COLLECTIONS.PROJECTS), {
            workspaceId: wsRef.id,
            name: 'General',
            description: 'My first project',
            status: 'active',
            area: 'Personal',
            priority: 'medium',
            ownerId: user.uid,
            dueDate: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
      }

      navigate(ROUTES.HOME);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">L</div>
           <h1 className="text-3xl font-bold text-gray-900">Welcome to Life OS</h1>
           <p className="text-gray-500 mt-2">Your all-in-one productivity workspace</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          )}
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};