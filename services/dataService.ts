import { useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp 
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

      const wsQuery = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('__name__', 'in', workspaceIds.slice(0, 10))
      );

      onSnapshot(wsQuery, (wsSnap) => {
        const workspaces = wsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setWorkspaces(workspaces);
        
        // Auto-select first workspace if none selected
        if (!currentWorkspaceId && workspaces.length > 0) {
          setCurrentWorkspaceId(workspaces[0].id);
        }
      }, (error) => {
        console.error("Error fetching workspaces:", error);
      });
    }, (error) => {
      console.error("Error fetching members:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Workspace Data
  // NOTE: Removed server-side orderBy to avoid needing manual Composite Indexes in Firebase Console.
  // We will trust the default order or sort client-side if needed.
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const projectsQ = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('workspaceId', '==', currentWorkspaceId)
    );
    
    const tasksQ = query(
      collection(db, COLLECTIONS.TASKS),
      where('workspaceId', '==', currentWorkspaceId)
    );

    const notesQ = query(
      collection(db, COLLECTIONS.NOTES),
      where('workspaceId', '==', currentWorkspaceId)
    );

    const filesQ = query(
      collection(db, COLLECTIONS.FILES),
      where('workspaceId', '==', currentWorkspaceId)
    );

    const unsubP = onSnapshot(projectsQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Sort client-side
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setProjects(data);
    }, (e) => console.error("Projects sync error:", e));

    const unsubT = onSnapshot(tasksQ, (s) => {
        setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (e) => console.error("Tasks sync error:", e));

    const unsubN = onSnapshot(notesQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        data.sort((a, b) => b.updatedAt?.seconds - a.updatedAt?.seconds);
        setNotes(data);
    }, (e) => console.error("Notes sync error:", e));

    const unsubF = onSnapshot(filesQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setFiles(data);
    }, (e) => console.error("Files sync error:", e));

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