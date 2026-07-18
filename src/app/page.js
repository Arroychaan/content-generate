'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import DraftCard from '@/components/DraftCard';

export default function Home() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handlePublishSuccess = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen bg-mesh text-white p-4 md:p-8 pb-24">
      {/* Hero Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 pt-4 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Sector-One
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base font-medium">Content Factory Dashboard &bull; AI Agentic Pipeline</p>
        </div>
        
        <button 
          onClick={fetchDrafts}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full glass-card text-sm font-semibold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Refresh'}
        </button>
      </motion.header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading && drafts.length === 0 ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : drafts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 glass-card rounded-2xl max-w-xl mx-auto"
          >
            <div className="text-5xl mb-4">💤</div>
            <h2 className="text-xl font-bold mb-2">No Ready Drafts</h2>
            <p className="text-gray-400 text-sm px-4">
              Pipeline is either waiting for the next cron cycle (30m) or currently generating contents in the background. Check back later!
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {drafts.map((draft) => (
              <motion.div key={draft.id} variants={itemVariants} className="flex h-full">
                <DraftCard 
                  draft={draft} 
                  onPublishSuccess={handlePublishSuccess} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
