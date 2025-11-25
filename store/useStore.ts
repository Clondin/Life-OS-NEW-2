import { create } from 'zustand';
import localforage from 'localforage';
import { User, Workspace, Project, Task, Note, FileData } from '../types';

localforage.config({ name: 'LifeOS', storeName: 'life_os_cache' });

interface StoreState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  files: FileData[];
  
  // Actions
  setUser: (user: User | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setNotes: (notes: Note[]) => void;
  setFiles: (files: FileData[]) => void;
  
  // Optimistic Helpers (Optional: real implementation relies on Firestore listeners updating this)
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  workspaces: [],
  currentWorkspaceId: null,
  projects: [],
  tasks: [],
  notes: [],
  files: [],

  setUser: (user) => set({ user }),
  setWorkspaces: (workspaces) => {
    set({ workspaces });
    localforage.setItem('workspaces', workspaces);
  },
  setCurrentWorkspaceId: (id) => {
    set({ currentWorkspaceId: id });
    if(id) localforage.setItem('lastWorkspaceId', id);
  },
  setProjects: (projects) => {
    set({ projects });
    localforage.setItem('projects', projects);
  },
  setTasks: (tasks) => {
    set({ tasks });
    localforage.setItem('tasks', tasks);
  },
  setNotes: (notes) => {
    set({ notes });
    localforage.setItem('notes', notes);
  },
  setFiles: (files) => {
    set({ files });
    localforage.setItem('files', files);
  },

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  })),
}));

export const hydrateStore = async () => {
  const store = useStore.getState();
  
  const [workspaces, projects, tasks, notes, files, lastWsId] = await Promise.all([
    localforage.getItem<Workspace[]>('workspaces'),
    localforage.getItem<Project[]>('projects'),
    localforage.getItem<Task[]>('tasks'),
    localforage.getItem<Note[]>('notes'),
    localforage.getItem<FileData[]>('files'),
    localforage.getItem<string>('lastWorkspaceId'),
  ]);

  if (workspaces) store.setWorkspaces(workspaces);
  if (projects) store.setProjects(projects);
  if (tasks) store.setTasks(tasks);
  if (notes) store.setNotes(notes);
  if (files) store.setFiles(files);
  if (lastWsId) store.setCurrentWorkspaceId(lastWsId);
};
