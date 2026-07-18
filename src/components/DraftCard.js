'use client';
import { useState } from 'react';
import { Share2, Image as ImageIcon, Type, Sparkles, Send, Copy, RefreshCw, Download } from 'lucide-react';
import { useWebShare } from '../hooks/useWebShare';

export default function DraftCard({ draft, onPublishSuccess }) {
  const { handlePublishOneClick, isSharing } = useWebShare();
  const [activeTab, setActiveTab] = useState('IG'); // 'IG' or 'X'

  const handlePost = async () => {
    await handlePublishOneClick(
      draft.id,
      draft.topic_title,
      draft.main_caption,
      draft.image_r2_url
    );
    if (onPublishSuccess) onPublishSuccess(draft.id);
  };

  const handleDownload = async () => {
    if (!draft.image_r2_url) return;
    try {
      const response = await fetch(draft.image_r2_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sector-one-content-${draft.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      window.open(draft.image_r2_url, '_blank');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-5 w-full transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 group relative overflow-hidden">
      
      {/* Decorative gradient orb for glassmorphism pop */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
          {draft.topic_title}
        </h3>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${draft.content_type === 'IMAGE' ? 'bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-300 border border-pink-500/30' : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'}`}>
          {draft.content_type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Type className="w-3 h-3" />}
          {draft.content_type === 'IMAGE' ? 'Instagram' : 'X/Threads'}
        </span>
      </div>

      {/* ----------------- INSTAGRAM VIEW (IMAGE) ----------------- */}
      {draft.content_type === 'IMAGE' && (
        <>
          {draft.image_r2_url && (
            <div className="w-full aspect-[4/3] sm:aspect-square bg-black/40 rounded-xl overflow-hidden relative border border-white/5 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={draft.image_r2_url} 
                alt="Draft Preview" 
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex-grow relative group/text overflow-y-auto max-h-48">
            <p className="text-gray-300 text-sm leading-relaxed font-mono text-[13px] whitespace-pre-wrap">
              {draft.main_caption}
            </p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(draft.main_caption || '');
                alert("Instagram caption copied!");
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-white/20 rounded text-gray-300 transition-colors backdrop-blur-md opacity-0 group-hover/text:opacity-100"
              title="Copy Caption"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* ----------------- X/THREADS VIEW (TEXT_ONLY) ----------------- */}
      {draft.content_type !== 'IMAGE' && (
        <div className="flex flex-col flex-grow gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('THREADS')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'THREADS' || activeTab === 'IG' ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Threads (Max 480)
            </button>
            <button 
              onClick={() => setActiveTab('X')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'X' ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              X (Max 280)
            </button>
          </div>

          <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex-grow relative group/text overflow-y-auto max-h-48">
            <p className="text-gray-300 text-sm leading-relaxed font-mono text-[13px] whitespace-pre-wrap">
              {(activeTab === 'X' 
                ? (draft.platform_variants?.x?.posts || draft.thread_posts || []) 
                : (draft.platform_variants?.threads?.posts || [])).join('\n\n---\n\n')}
            </p>
            <button 
              onClick={() => {
                const posts = activeTab === 'X' 
                  ? (draft.platform_variants?.x?.posts || draft.thread_posts || [])
                  : (draft.platform_variants?.threads?.posts || []);
                navigator.clipboard.writeText(posts.join('\n\n'));
                alert(`${activeTab === 'X' ? 'X Thread' : 'Threads'} copied!`);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-white/20 rounded text-gray-300 transition-colors backdrop-blur-md opacity-0 group-hover/text:opacity-100"
              title="Copy Thread"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        {draft.content_type === 'IMAGE' && draft.image_r2_url && (
          <button
            onClick={handleDownload}
            className="p-3.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shadow-lg flex items-center justify-center active:scale-[0.98]"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handlePost}
          disabled={isSharing}
          className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isSharing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              <span>Post & Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
