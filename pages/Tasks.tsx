import React from 'react';
import { useStore } from '../store/useStore';
import { Task, TaskStatus, TaskPriority } from '../types';
import { updateTaskStatus } from '../services/dataService';

export const Tasks: React.FC = () => {
  const { tasks } = useStore();

  const columns = [
    { id: TaskStatus.TODO, title: 'To Do', color: 'bg-gray-100' },
    { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-50' },
    { id: TaskStatus.DONE, title: 'Done', color: 'bg-green-50' }
  ];

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDrop = async (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    await updateTaskStatus(taskId, status);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Board</h2>
      
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
          <div 
            key={col.id} 
            className="flex-1 min-w-[300px] bg-gray-50 rounded-xl p-4 flex flex-col"
            onDrop={(e) => onDrop(e, col.id)}
            onDragOver={onDragOver}
          >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded text-sm text-gray-500 shadow-sm">
                    {tasks.filter(t => t.status === col.id).length}
                </span>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto">
                {tasks.filter(t => t.status === col.id).map(task => (
                    <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
                                task.priority === TaskPriority.HIGH ? 'bg-red-50 text-red-600' : 
                                task.priority === TaskPriority.MEDIUM ? 'bg-yellow-50 text-yellow-600' : 
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {task.priority}
                            </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                        {task.dueDate && (
                             <div className="text-xs text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                {task.dueDate}
                             </div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
