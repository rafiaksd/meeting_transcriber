import { Cpu, CheckCircle2 } from 'lucide-react'

export default function SystemStatus({ statusData }) {
  const isProcessing = statusData.status === 'processing'

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${isProcessing ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isProcessing ? <Cpu className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
          {isProcessing && (
            <span className="absolute -top-1 -right-1">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{isProcessing ? 'Transcriber Active' : 'System Ready'}</h3>
          <p className="text-sm text-slate-500">
            {isProcessing ? `Processing: ${statusData.processing_file || 'file'}` : 'Waiting for new audio files'}
          </p>
        </div>
      </div>
      <div className="px-6 py-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Queue</p>
        <p className="text-xl font-bold text-slate-700">{statusData.queue_length || 0}</p>
      </div>
    </div>
  )
}