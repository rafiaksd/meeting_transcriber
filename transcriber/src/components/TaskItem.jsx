import React from 'react';
import { Clock, FileText, Loader } from 'lucide-react';

const TaskItem = ({ task, onExpand }) => {
  let statusColor = "bg-slate-100 text-slate-500";
  let StatusIcon = Clock;
  
  if (task.status === 'done') {
    statusColor = "bg-blue-50 text-blue-600 border border-blue-100";
    StatusIcon = FileText;
  } else if (task.status === 'processing') {
    statusColor = "bg-amber-50 text-amber-600 border border-amber-100";
    StatusIcon = Loader;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColor}`}>
            <StatusIcon className={`w-5 h-5 ${task.status === 'processing' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="font-medium text-slate-800 truncate max-w-[200px]">{task.filename}</h4>
            <span className="text-xs text-slate-400">{task.timestamp}</span>
          </div>
        </div>
        <div className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 capitalize">
          {task.status}
        </div>
      </div>

      {task.status === 'done' ? (
        <button 
          onClick={() => onExpand(task)}
          className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          View Transcript
        </button>
      ) : (
        <div className="w-full h-9 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
          {task.status === 'queued' ? 'Waiting in queue...' : 'Transcribing...'}
        </div>
      )}
    </div>
  );
};

export default TaskItem;