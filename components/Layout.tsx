import React, { useState } from 'react';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { useStore } from '../store/useStore';
    import { auth } from '../lib/firebase';
    import { ROUTES } from '../constants';
    import { HomeIcon, FolderIcon, ClipboardIcon, DocumentIcon, PaperClipIcon, UserIcon, PlusIcon, SearchIcon } from './Icons';
    import { addTask } from '../services/dataService';
    import { TaskStatus, TaskPriority } from '../types';
    
    interface LayoutProps {
      children: React.ReactNode;
    }
    
    export const Layout: React.FC<LayoutProps> = ({ children }) => {
      const { user, workspaces, currentWorkspaceId, setCurrentWorkspaceId, projects } = useStore();
      const location = useLocation();
      const navigate = useNavigate();
      const [isQuickAddOpen, setQuickAddOpen] = useState(false);
      const [quickTaskTitle, setQuickTaskTitle] = useState('');
    
      const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
    
      const handleSignOut = () => {
        auth.signOut();
        navigate(ROUTES.LOGIN);
      };
    
      const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskTitle.trim() || !currentWorkspaceId || !user) return;
    
        // Find default project or use none? We need projectId. Let's try to find an 'Inbox' or just first project.
        // For strictness with type, we need projectId. If none, we can perhaps have a 'general' project concept or empty string if allowed.
        // Let's assume the first project is default for quick add or empty string if supported.
        const defaultProject = projects[0]?.id || 'inbox'; 
    
        await addTask({
          workspaceId: currentWorkspaceId,
          projectId: defaultProject,
          title: quickTaskTitle,
          description: '',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assigneeId: user.uid,
          ownerId: user.uid,
          dueDate: null,
          estimatedMinutes: 0,
          completedAt: null
        });
        setQuickTaskTitle('');
        setQuickAddOpen(false);
      };
    
      const navItems = [
        { path: ROUTES.HOME, label: 'Home', icon: HomeIcon },
        { path: ROUTES.PROJECTS, label: 'Projects', icon: FolderIcon },
        { path: ROUTES.TASKS, label: 'Tasks', icon: ClipboardIcon },
        { path: ROUTES.NOTES, label: 'Notes', icon: DocumentIcon },
        { path: ROUTES.FILES, label: 'Files', icon: PaperClipIcon },
      ];
    
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
                <span className="font-bold text-gray-800">Life OS</span>
              </div>
            </div>
    
            <div className="p-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace</label>
              <select 
                className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-50"
                value={currentWorkspaceId || ''}
                onChange={(e) => setCurrentWorkspaceId(e.target.value)}
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
    
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
    
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">Online</p>
                </div>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
    
          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
              <h1 className="text-xl font-semibold text-gray-800">
                {currentWorkspace?.name || 'Loading...'}
              </h1>
    
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search (Cmd+K)"
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <button 
                  onClick={() => setQuickAddOpen(true)}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-sm transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </header>
    
            <div className="flex-1 overflow-auto p-6">
              {children}
            </div>
          </main>
    
          {/* Quick Add Modal */}
          {isQuickAddOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Add Task</h3>
                <form onSubmit={handleQuickAdd}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="What needs to be done?"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4 p-2 border"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setQuickAddOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    };
    