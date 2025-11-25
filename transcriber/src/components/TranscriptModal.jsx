import React, { useState } from 'react';
import { X, Copy, FileText, Sparkles } from 'lucide-react';

const TranscriptModal = ({ task, onClose }) => {
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' or 'summary'

  if (!task) return null;

  const copyText = () => {
    const textToCopy = activeTab === 'transcript' ? task.transcript : task.summary;
    navigator.clipboard.writeText(textToCopy || "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Meeting Results</h2>
            <p className="text-sm text-slate-500 max-w-[300px] truncate">{task.filename}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-4 gap-4">
            <button 
                onClick={() => setActiveTab('transcript')}
                className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'transcript' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <FileText className="w-4 h-4" />
                Transcript
            </button>
            <button 
                onClick={() => setActiveTab('summary')}
                className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'summary' 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Sparkles className="w-4 h-4" />
                AI Summary
            </button>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white min-h-[300px]">
          {activeTab === 'transcript' ? (
            <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-mono text-sm">
                    {task.transcript || "No transcript available."}
                </p>
            </div>
          ) : (
            <div className="prose prose-purple max-w-none">
                {task.summary ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {task.summary}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                        <p>Summary not available...</p>
                        <p className="text-xs mt-1">Try uploading again.</p>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={copyText} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 cursor-pointer hover:bg-orange-200 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Copy className="w-4 h-4" /> 
            {activeTab === 'transcript' ? 'Copy Transcript' : 'Copy Summary'}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;