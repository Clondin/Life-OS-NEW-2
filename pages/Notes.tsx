import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DocumentIcon, PlusIcon } from '../components/Icons';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

export const Notes: React.FC = () => {
  const { notes, currentWorkspaceId, user, projects } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentWorkspaceId || !user) return;

    await addDoc(collection(db, COLLECTIONS.NOTES), {
      workspaceId: currentWorkspaceId,
      projectId: projects[0]?.id || 'none', // Link to first project by default
      title: newTitle,
      content: newContent,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notes</h2>
        <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
            <PlusIcon className="w-4 h-4" />
            New Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3 text-gray-400">
                <DocumentIcon className="w-5 h-5" />
                <span className="text-xs">{new Date((note.updatedAt as any)?.seconds * 1000).toLocaleDateString()}</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{note.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-4">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-20 text-gray-400">
                No notes found. Create one to get started.
            </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">New Note</h3>
                    <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form onSubmit={handleCreate} className="flex-1 flex flex-col p-6 overflow-hidden">
                    <input 
                        type="text" 
                        placeholder="Note Title" 
                        className="text-xl font-bold border-none focus:ring-0 placeholder-gray-300 mb-4 w-full p-0"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        autoFocus
                    />
                    <textarea 
                        placeholder="Write something..." 
                        className="flex-1 w-full border-none focus:ring-0 resize-none placeholder-gray-300 p-0 text-gray-600"
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                    />
                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Save Note</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};