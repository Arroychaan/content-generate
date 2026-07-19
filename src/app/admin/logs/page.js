'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Server, AlertCircle, Info, RefreshCw } from 'lucide-react';

export default function LogsDashboard() {
  const [authKey, setAuthKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = async (keyToUse) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/logs?key=${encodeURIComponent(keyToUse)}`);
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.data);
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Invalid Access Key');
        setIsAuthenticated(false);
      }
    } catch (e) {
      setErrorMsg('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authKey.trim()) {
      fetchLogs(authKey);
    }
  };

  const getEventStyle = (eventType) => {
    if (eventType.includes('ERROR') || eventType.includes('FAIL')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (eventType.includes('SUCCESS') || eventType.includes('COMPLETED')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'; // Info
  };

  const getSystemStatus = () => {
    if (logs.length === 0) return { label: 'RESTING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' };
    
    const lastPipelineEvent = logs.find(l => 
      l.event_type === 'PIPELINE_START' || 
      l.event_type === 'PIPELINE_SUCCESS' || 
      l.event_type === 'PIPELINE_FATAL_ERROR'
    );
    
    if (lastPipelineEvent && lastPipelineEvent.event_type === 'PIPELINE_START') {
      return { label: 'WORKING', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400 animate-pulse' };
    }
    
    return { label: 'RESTING / SLEEP', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' };
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-mesh text-white p-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Restricted Area</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your CRON_SECRET to view system activity logs.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password"
              placeholder="Secret Key..."
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            {errorMsg && <p className="text-red-400 text-xs text-left">{errorMsg}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Access Logs'}
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mesh text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-black tracking-tight text-white">System Logs</h1>
              
              {/* AI Status Badge */}
              {logs.length > 0 && (
                <div className={`ml-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest border flex items-center gap-2 ${getSystemStatus().color}`}>
                  <span className={`w-2 h-2 rounded-full ${getSystemStatus().dot}`}></span>
                  {getSystemStatus().label}
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm">Real-time monitoring for AI autonomous agents.</p>
          </div>
          
          <button 
            onClick={() => fetchLogs(authKey)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm font-semibold hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Logs Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Agent Stage</th>
                  <th className="px-6 py-4 font-semibold w-full">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${getEventStyle(log.event_type)}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono">
                        {log.agent_stage ? `Stage ${log.agent_stage}` : 'System'}
                      </td>
                      <td className="px-6 py-4 text-gray-300 whitespace-normal min-w-[300px]">
                        {log.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
