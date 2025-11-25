import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ROUTES, COLLECTIONS } from '../constants';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create/Update user doc
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create default workspace for new user
        const wsRef = await addDoc(collection(db, COLLECTIONS.WORKSPACES), {
          name: "My Workspace",
          ownerId: user.uid,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, COLLECTIONS.WORKSPACE_MEMBERS), {
          workspaceId: wsRef.id,
          userId: user.uid,
          role: 'owner',
          createdAt: serverTimestamp()
        });

        // Create a default project
        await addDoc(collection(db, COLLECTIONS.PROJECTS), {
            workspaceId: wsRef.id,
            name: 'General',
            description: 'Default project',
            status: 'active',
            area: 'Life',
            priority: 'medium',
            ownerId: user.uid,
            dueDate: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
      }

      navigate(ROUTES.HOME);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">L</div>
           <h1 className="text-3xl font-bold text-gray-900">Welcome to Life OS</h1>
           <p className="text-gray-500 mt-2">Your all-in-one productivity workspace</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};
