'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Server, AlertCircle, Info, RefreshCw, Play, Square, Power, CheckCircle2, XCircle } from 'lucide-react';

export default function LogsDashboard() {
  const [authKey, setAuthKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState('RUNNING'); // 'RUNNING' or 'STOPPED'
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchLogsAndStatus = async (keyToUse) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch logs
      const resLogs = await fetch(`/api/logs?key=${encodeURIComponent(keyToUse)}`);
      const dataLogs = await resLogs.json();
      
      if (dataLogs.success) {
        setLogs(dataLogs.data);
        setIsAuthenticated(true);

        // Fetch System Control Status
        try {
          const resStatus = await fetch(`/api/admin/system-control?key=${encodeURIComponent(keyToUse)}`);
          const dataStatus = await resStatus.json();
          if (dataStatus.success) {
            setSystemStatus(dataStatus.status);
          }
        } catch (e) {
          console.warn('Failed to fetch system control status:', e.message);
        }
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
      fetchLogsAndStatus(authKey);
    }
  };

  const handleSystemControl = async (action) => {
    setControlLoading(true);
    setActionSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: authKey, action })
      });
      const data = await res.json();
      if (data.success) {
        setSystemStatus(data.status);
        setActionSuccessMsg(data.message);
        setTimeout(() => setActionSuccessMsg(''), 5000);
        // Refresh logs immediately
        fetchLogsAndStatus(authKey);
      } else {
        setErrorMsg(data.error || 'Gagal mengubah status sistem.');
      }
    } catch (e) {
      setErrorMsg('Gagal terhubung ke server untuk mengubah status.');
    } finally {
      setControlLoading(false);
    }
  };

  const getEventStyle = (eventType) => {
    if (eventType.includes('ERROR') || eventType.includes('FAIL') || eventType.includes('STOP') || eventType.includes('BLOCKED')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (eventType.includes('SUCCESS') || eventType.includes('START') || eventType.includes('COMPLETED')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'; // Info
  };

  const getSystemStatusBadge = () => {
    if (systemStatus === 'STOPPED') {
      return {
        label: 'STOPPED (SYSTEM OFF)',
        color: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10',
        dot: 'bg-red-500 animate-ping'
      };
    }
    
    // System is RUNNING
    const lastPipelineEvent = logs.find(l => 
      l.event_type === 'PIPELINE_START' || 
      l.event_type === 'PIPELINE_SUCCESS' || 
      l.event_type === 'PIPELINE_FATAL_ERROR'
    );
    
    if (lastPipelineEvent && lastPipelineEvent.event_type === 'PIPELINE_START') {
      return { label: 'RUNNING (WORKING)', color: 'bg-green-500/20 text-green-400 border-green-500/40', dot: 'bg-green-400 animate-pulse' };
    }
    
    return { label: 'RUNNING (ACTIVE)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' };
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
            Masukkan CRON_SECRET untuk mengakses Control Panel.
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
              {loading ? 'Verifying...' : 'Access Dashboard'}
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
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <ShieldCheck className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-black tracking-tight text-white">System Control & Logs</h1>
              
              {/* AI Status Badge */}
              <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest border flex items-center gap-2 ${getSystemStatusBadge().color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${getSystemStatusBadge().dot}`}></span>
                {getSystemStatusBadge().label}
              </div>
            </div>
            <p className="text-gray-400 text-sm">Sakelar Utama Master & Monitoring Real-Time Agen AI.</p>
          </div>
          
          {/* Action Buttons: Refresh & Start/Stop */}
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => fetchLogsAndStatus(authKey)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* MASTER START / STOP BUTTONS */}
            {systemStatus === 'STOPPED' ? (
              <button
                onClick={() => handleSystemControl('START')}
                disabled={controlLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-green-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {controlLoading ? 'Memproses...' : 'MULAI (START)'}
              </button>
            ) : (
              <button
                onClick={() => handleSystemControl('STOP')}
                disabled={controlLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold text-sm hover:from-rose-500 hover:to-red-600 shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 animate-pulse hover:animate-none"
              >
                <Square className="w-4 h-4 fill-current" />
                {controlLoading ? 'Memproses...' : 'BERHENTI (STOP)'}
              </button>
            )}
          </div>
        </header>

        {/* Master Control Notice / Success Banner */}
        {actionSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              systemStatus === 'RUNNING' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {systemStatus === 'RUNNING' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{actionSuccessMsg}</span>
          </motion.div>
        )}

        {/* Emergency Stop Alert Bar */}
        {systemStatus === 'STOPPED' && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 animate-bounce" />
              <div>
                <h4 className="font-bold text-sm text-red-300">SISTEM DALAM KEADAAN BERHENTI (STOPPED)</h4>
                <p className="text-xs text-red-400/90">Seluruh agen AI telah diblokir dan tidak ada pipeline yang diizinkan berjalan sampai Anda menekan tombol MULAI.</p>
              </div>
            </div>
            <button
              onClick={() => handleSystemControl('START')}
              disabled={controlLoading}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              Aktifkan Sekarang (MULAI)
            </button>
          </div>
        )}

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
                        {log.agent_stage !== null && log.agent_stage !== undefined ? `Stage ${log.agent_stage}` : 'System'}
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
