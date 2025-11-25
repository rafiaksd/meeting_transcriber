import React, { useState, useEffect } from 'react';
import { Mic2, PlusCircle, ShieldCheck } from 'lucide-react';
import { api } from './api/api';

import SystemStatus from './components/SystemStatus';
import Uploader from './components/Uploader';
import TaskItem from './components/TaskItem';
import TranscriptModal from './components/TranscriptModal';

function App() {
  const [statusData, setStatusData] = useState({ status: 'idle', queue_length: 0 });
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // 1. Unified Polling Loop
  // Instead of separate polls that might desync, we run them together
  useEffect(() => {
    const syncState = async () => {
      try {
        // A. Get Global Status (for the top banner)
        const globalStatus = await api.getStatus();
        setStatusData(globalStatus);

        // B. Get History (for the list)
        // Since we fixed the backend logic, /history returns the CORRECT status now.
        const historyData = await api.getHistory();
        
        // We only need to check results for items that just turned 'done' but have no transcript loaded
        setTasks(currentTasks => {
          // If the list length matches and statuses match, don't update (prevents re-renders)
          const hasChanged = JSON.stringify(currentTasks) !== JSON.stringify(historyData);
          return hasChanged ? historyData : currentTasks;
        });

      } catch (e) {
        console.error("Sync error:", e);
      }
    };

    // Initial load
    syncState();
    
    // Poll every 2 seconds
    const interval = setInterval(syncState, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleNewUpload = (newTask) => {
    // Optimistic update
    setTasks(prev => [newTask, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white pt-12 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4 opacity-80">
            <Mic2 className="w-6 h-6" />
            <span className="text-sm font-medium tracking-wider uppercase">Internal Tool</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Meeting Mind Hub</h1>
          <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
            Drop your meeting recordings here. We'll queue them up and transcribe the audio while you wait.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 -mt-16 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <SystemStatus statusData={statusData} />
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-500" />
                  New Transcription
                </h2>
                <Uploader onUpload={handleNewUpload} />
              </div>

              {tasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Session History</h2>
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <TaskItem key={task.id} task={task} onExpand={setSelectedTask} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-lg sticky top-6">
                <h3 className="text-white font-bold text-lg mb-4">How it works</h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <span>Upload an audio file (MP3, WAV).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <span>The file enters the Global Queue.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                    <span>Whisper AI processes files.</span>
                  </li>
                </ul>
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Secure Local Processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedTask && (
        <TranscriptModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

export default App;