import { useState } from 'react';

export function useWebShare() {
  const [isSharing, setIsSharing] = useState(false);

  const handlePublishOneClick = async (draftId, title, caption, imageUrl) => {
    setIsSharing(true);
    try {
      // 1. Mark as published instantly in Supabase so it doesn't reappear
      await fetch(`/api/drafts/${draftId}/publish`, { method: 'POST' });

      let fileToShare = null;
      if (imageUrl) {
        // 2. Download image from Cloudflare R2 to local memory via Blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        fileToShare = new File([blob], 'content_production.png', { type: 'image/png' });
      }

      // 3. Check Web Share API compatibility
      const shareData = {
        title: title,
        text: caption,
      };

      if (fileToShare) {
        shareData.files = [fileToShare];
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Clipboard + Deep Linking
        await navigator.clipboard.writeText(caption);
        alert("Teks telah disalin ke clipboard. Buka aplikasi media sosial Anda.");
        window.open('instagram://camera', '_blank');
      }
    } catch (error) {
      console.error('FRONTEND_SHARE_ERROR', error.message);
    } finally {
      setIsSharing(false);
    }
  };

  return { handlePublishOneClick, isSharing };
}
