import { useEffect, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, writeBatch 
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

  // Refs to track unsubscribes for nested listeners
  const workspacesUnsubRef = useRef<() => void | undefined>(undefined);

  // 1. Sync User's Workspace Memberships
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
      where('userId', '==', user.uid)
    );

    const unsubscribeMembers = onSnapshot(q, (snapshot) => {
      const workspaceIds = snapshot.docs.map(d => d.data().workspaceId);
      
      // Clean up previous workspaces listener
      if (workspacesUnsubRef.current) {
        workspacesUnsubRef.current();
        workspacesUnsubRef.current = undefined;
      }

      if (workspaceIds.length === 0) {
        setWorkspaces([]);
        return;
      }

      // Create new workspaces listener
      // Firestore 'in' query supports up to 10 items. 
      // For production, batching logic would be needed for >10 workspaces.
      const safeIds = workspaceIds.slice(0, 10);
      
      const wsQuery = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('__name__', 'in', safeIds)
      );

      workspacesUnsubRef.current = onSnapshot(wsQuery, (wsSnap) => {
        const workspaces = wsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setWorkspaces(workspaces);
        
        // Auto-select logic
        const state = useStore.getState(); // Get fresh state
        if (!state.currentWorkspaceId && workspaces.length > 0) {
          setCurrentWorkspaceId(workspaces[0].id);
        }
      }, (error) => {
        console.error("Error syncing workspaces:", error);
      });

    }, (error) => {
      console.error("Error syncing members:", error);
    });

    return () => {
      unsubscribeMembers();
      if (workspacesUnsubRef.current) workspacesUnsubRef.current();
    };
  }, [user]);

  // 2. Sync Workspace Data (Projects, Tasks, etc.)
  useEffect(() => {
    if (!currentWorkspaceId) {
      setProjects([]);
      setTasks([]);
      setNotes([]);
      setFiles([]);
      return;
    }

    // Queries
    const projectsQ = query(collection(db, COLLECTIONS.PROJECTS), where('workspaceId', '==', currentWorkspaceId));
    const tasksQ = query(collection(db, COLLECTIONS.TASKS), where('workspaceId', '==', currentWorkspaceId));
    const notesQ = query(collection(db, COLLECTIONS.NOTES), where('workspaceId', '==', currentWorkspaceId));
    const filesQ = query(collection(db, COLLECTIONS.FILES), where('workspaceId', '==', currentWorkspaceId));

    // Listeners
    const unsubP = onSnapshot(projectsQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setProjects(data);
    }, e => console.error("Projects sync error", e));

    const unsubT = onSnapshot(tasksQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Sort tasks client side if needed, or rely on UI
        setTasks(data);
    }, e => console.error("Tasks sync error", e));

    const unsubN = onSnapshot(notesQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        data.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setNotes(data);
    }, e => console.error("Notes sync error", e));

    const unsubF = onSnapshot(filesQ, (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFiles(data);
    }, e => console.error("Files sync error", e));

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