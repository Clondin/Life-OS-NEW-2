import React from 'react';
import { useStore } from '../store/useStore';
import { DocumentIcon } from '../components/Icons';

export const Notes: React.FC = () => {
  const { notes } = useStore();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-3 text-gray-400">
                <DocumentIcon className="w-5 h-5" />
                <span className="text-xs">{new Date((note.updatedAt as any)?.seconds * 1000).toLocaleDateString()}</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">{note.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-4">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
                No notes found. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
};
