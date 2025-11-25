import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { FolderIcon } from '../components/Icons';

export const Projects: React.FC = () => {
  const { projects, tasks } = useStore();

  const getProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const progress = getProgress(project.id);
          
          return (
            <Link 
              key={project.id} 
              to={`/app/projects/${project.id}`}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FolderIcon className="w-6 h-6" />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{project.description || 'No description'}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
                <span className="text-xs text-gray-500 ml-auto">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }} 
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
