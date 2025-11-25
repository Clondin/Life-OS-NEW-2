import React from 'react';
import { useStore } from '../store/useStore';
import { TaskStatus, TaskPriority } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { updateTaskStatus } from '../services/dataService';

export const Home: React.FC = () => {
  const { user, tasks, projects } = useStore();

  const today = new Date().toISOString().split('T')[0];
  
  const dueToday = tasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && t.dueDate.startsWith(today));
  const upcoming = tasks.filter(t => t.status !== TaskStatus.DONE && (!t.dueDate || t.dueDate > today)).slice(0, 5);

  const stats = [
    { name: 'To Do', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3b82f6' },
    { name: 'Done', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#22c55e' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.displayName?.split(' ')[0]}</h2>
          <p className="text-gray-500 mt-1">Here's what's on your plate today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task Overview Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 w-full text-left">Overview</h3>
            <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={stats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs mt-2">
                {stats.map(s => (
                    <div key={s.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span>{s.name} ({s.value})</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Due Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Due Today</h3>
          {dueToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <p>No tasks due today. Enjoy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dueToday.map(task => {
                 const project = projects.find(p => p.id === task.projectId);
                 return (
                    <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition-all">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            checked={task.status === TaskStatus.DONE}
                            onChange={() => updateTaskStatus(task.id, TaskStatus.DONE)}
                        />
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{task.title}</h4>
                            <p className="text-xs text-gray-500">{project?.name || 'Inbox'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === TaskPriority.HIGH ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {task.priority}
                        </span>
                    </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Upcoming</h3>
        <div className="space-y-2">
            {upcoming.map(task => (
                 <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-gray-300'}`} />
                         <span className="text-gray-700">{task.title}</span>
                    </div>
                    <span className="text-sm text-gray-400">{task.dueDate || 'No Date'}</span>
                 </div>
            ))}
            {upcoming.length === 0 && <p className="text-gray-400 text-sm">No upcoming tasks.</p>}
        </div>
      </div>
    </div>
  );
};
