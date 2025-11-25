import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { PaperClipIcon, PlusIcon } from '../components/Icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

export const Files: React.FC = () => {
  const { files, currentWorkspaceId, user, projects } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspaceId || !user) return;

    try {
      setUploading(true);
      // Create storage ref: workspaces/{wsId}/files/{fileName}
      const storageRef = ref(storage, `workspaces/${currentWorkspaceId}/files/${Date.now()}_${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save metadata to Firestore
      await addDoc(collection(db, COLLECTIONS.FILES), {
        workspaceId: currentWorkspaceId,
        projectId: projects[0]?.id || 'none', // Default to first project or none
        taskId: null,
        storagePath: snapshot.ref.fullPath,
        downloadURL: downloadURL,
        fileName: file.name,
        fileType: file.type.split('/')[1] || 'unknown',
        size: file.size,
        uploadedBy: user.uid,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Files</h2>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {files.map(file => (
                    <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <PaperClipIcon className="w-5 h-5" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.fileName}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(file.size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{file.fileType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date((file.createdAt as any)?.seconds * 1000).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href={(file as any).downloadURL} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900">Download</a>
                        </td>
                    </tr>
                ))}
                {files.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                            No files uploaded yet.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};