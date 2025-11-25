import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { TaskStatus, TaskPriority } from '../types';
import { updateTaskStatus } from '../services/dataService';
import { FolderIcon, ClipboardIcon, DocumentIcon } from '../components/Icons';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, tasks, notes } = useStore();

  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-700">Project not found</h2>
            <button onClick={() => navigate('/app/projects')} className="text-blue-600 hover:underline mt-2">Back to Projects</button>
        </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectNotes = notes.filter(n => n.projectId === projectId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
            <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm">
                <FolderIcon className="w-4 h-4" />
                <span>Projects</span>
                <span>/</span>
                <span>{project.area}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-2 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
                {project.status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 uppercase">
                {project.priority}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardIcon className="w-5 h-5 text-gray-400" />
                    Tasks ({projectTasks.length})
                </h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {projectTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No tasks in this project</div>
                ) : (
                    projectTasks.map(task => (
                        <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <input 
                                type="checkbox"
                                checked={task.status === TaskStatus.DONE}
                                onChange={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <div className="flex-1">
                                <h4 className={`font-medium ${task.status === TaskStatus.DONE ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {task.title}
                                </h4>
                                {task.dueDate && <p className="text-xs text-gray-400 mt-1">Due {task.dueDate}</p>}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                task.priority === TaskPriority.HIGH ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {task.priority}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Notes & Metadata Column */}
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Project Info</h3>
                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Created</dt>
                        <dd className="text-gray-900">{new Date((project.createdAt as any)?.seconds * 1000).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Owner</dt>
                        <dd className="text-gray-900">You</dd>
                    </div>
                </dl>
             </div>

             <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                    Notes ({projectNotes.length})
                </h3>
                <div className="space-y-3">
                    {projectNotes.map(note => (
                        <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                            <h4 className="font-bold text-gray-800 text-sm mb-1">{note.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                        </div>
                    ))}
                    {projectNotes.length === 0 && <p className="text-gray-400 text-sm">No notes attached.</p>}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};