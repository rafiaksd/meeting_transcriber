import React from 'react';
import { X, Copy } from 'lucide-react';

const TranscriptModal = ({ task, onClose }) => {
  if (!task) return null;

  const copyText = () => {
    navigator.clipboard.writeText(task.transcript);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Meeting Transcript</h2>
            <p className="text-sm text-slate-500">{task.filename}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{task.transcript}</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={copyText} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Copy className="w-4 h-4" /> Copy Text
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;