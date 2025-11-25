import { useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { COLLECTIONS } from '../constants';
import { Task, TaskStatus } from '../types';

export const useDataSync = () => {
  const { 
    user, currentWorkspaceId, 
    setWorkspaces, setProjects, setTasks, setNotes, setFiles, setCurrentWorkspaceId 
  } = useStore();

  // Sync Workspaces for User
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workspaceIds = snapshot.docs.map(d => d.data().workspaceId);
      
      if (workspaceIds.length === 0) {
        setWorkspaces([]);
        return;
      }

      // In a real app we might need to batch fetch if > 10, or rely on a separate 'users/{uid}/workspaces' map.
      // For this scale, we fetch all workspaces where ID is in the list.
      // Note: 'in' query supports up to 10. We'll assume small scale or implement better later.
      const wsQuery = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('__name__', 'in', workspaceIds.slice(0, 10)) // Limit to 10 for safety
      );

      onSnapshot(wsQuery, (wsSnap) => {
        const workspaces = wsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setWorkspaces(workspaces);
        
        // Auto-select first workspace if none selected
        if (!currentWorkspaceId && workspaces.length > 0) {
          setCurrentWorkspaceId(workspaces[0].id);
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Workspace Data (Projects, Tasks, Notes, Files)
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const projectsQ = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('workspaceId', '==', currentWorkspaceId),
      orderBy('createdAt', 'desc')
    );
    
    const tasksQ = query(
      collection(db, COLLECTIONS.TASKS),
      where('workspaceId', '==', currentWorkspaceId)
    );

    const notesQ = query(
      collection(db, COLLECTIONS.NOTES),
      where('workspaceId', '==', currentWorkspaceId),
      orderBy('updatedAt', 'desc')
    );

    const filesQ = query(
      collection(db, COLLECTIONS.FILES),
      where('workspaceId', '==', currentWorkspaceId),
      orderBy('createdAt', 'desc')
    );

    const unsubP = onSnapshot(projectsQ, (s) => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    const unsubT = onSnapshot(tasksQ, (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    const unsubN = onSnapshot(notesQ, (s) => setNotes(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    const unsubF = onSnapshot(filesQ, (s) => setFiles(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));

    return () => {
      unsubP(); unsubT(); unsubN(); unsubF();
    };
  }, [currentWorkspaceId]);
};

// Actions
export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const newTask = { ...task, createdAt: now, updatedAt: now, completedAt: null };
    await addDoc(collection(db, COLLECTIONS.TASKS), newTask);
  } catch (error) {
    console.error("Error adding task", error);
  }
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  try {
    const ref = doc(db, COLLECTIONS.TASKS, taskId);
    const updates: any = { status, updatedAt: Timestamp.now() };
    if (status === TaskStatus.DONE) {
      updates.completedAt = Timestamp.now();
    } else {
      updates.completedAt = null;
    }
    await updateDoc(ref, updates);
  } catch (error) {
    console.error("Error updating task", error);
  }
};
