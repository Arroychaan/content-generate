'use client';
import { useWebShare } from '../hooks/useWebShare';

export default function DraftCard({ draft, onPublishSuccess }) {
  const { handlePublishOneClick, isSharing } = useWebShare();

  const handlePost = async () => {
    await handlePublishOneClick(
      draft.id,
      draft.topic_title,
      draft.main_caption,
      draft.image_r2_url
    );
    if (onPublishSuccess) onPublishSuccess(draft.id);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-white line-clamp-2">{draft.topic_title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${draft.content_type === 'IMAGE' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
          {draft.content_type}
        </span>
      </div>
      
      {draft.image_r2_url && (
        <div className="w-full aspect-square bg-gray-800 rounded-lg overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={draft.image_r2_url} 
            alt="Draft Preview" 
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      )}

      <p className="text-gray-400 text-sm line-clamp-3">
        {draft.main_caption}
      </p>

      <button
        onClick={handlePost}
        disabled={isSharing}
        className="w-full py-3 mt-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {isSharing ? 'Processing...' : 'Post Now'}
      </button>
    </div>
  );
}
