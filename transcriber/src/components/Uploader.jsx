import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { api } from '../api/api';

const Uploader = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file) => {
    setIsUploading(true);
    try {
      const data = await api.uploadAudio(file);
      if (data.task_id) {
        onUpload({
          id: data.task_id,
          filename: file.name,
          status: 'queued',
          transcript: null,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      alert("Upload failed. Is the backend running? ERROR: " + err);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 border-2 border-dashed rounded-2xl p-10 text-center
      ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*,video/mp4,video/*"
        onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${isUploading ? 'animate-bounce' : ''}`}>
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-blue-500" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            {isUploading ? 'Uploading Audio/Mp4...' : 'Click or Drag Audio / MP4 Here'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">MP3, WAV, MP4, M4A supported</p>
        </div>
      </div>
    </div>
  );
};

export default Uploader;