'use client';
import { useEffect, useState } from 'react';
import DraftCard from '@/components/DraftCard';

export default function Home() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
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
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 pb-20">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-black">ARproject</h1>
        <p className="text-gray-400 text-sm">Content Factory Dashboard</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No ready drafts available.<br/>Pipeline might be running.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <DraftCard 
              key={draft.id} 
              draft={draft} 
              onPublishSuccess={handlePublishSuccess} 
            />
          ))}
        </div>
      )}
    </main>
  );
}
