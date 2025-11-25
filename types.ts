import { Timestamp } from 'firebase/firestore';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: Timestamp;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  area: string;
  priority: TaskPriority;
  ownerId: string;
  dueDate: string | null; // ISO string
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  ownerId: string;
  dueDate: string | null;
  estimatedMinutes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface Note {
  id: string;
  workspaceId: string;
  projectId: string; // Can be 'none' if global
  title: string;
  content: string; // Markdown
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FileData {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string | null;
  storagePath: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  createdAt: Timestamp;
}
