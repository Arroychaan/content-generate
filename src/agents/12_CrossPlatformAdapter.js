import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { generateThreadsForPlatforms } from '../services/content/ThreadGenerator';

export async function execute(draftContext = {}) {
  console.log('Executing 12_CrossPlatformAdapter...');
  
  const { drafts, topic } = draftContext;
  
  // Platform Variants Base
  const platformVariants = {
    instagram: drafts.caption,
    x: { posts: [] },
    threads: { posts: [] }
  };

  try {
    const threadData = await generateThreadsForPlatforms(topic, drafts);
    platformVariants.x = { posts: threadData.x };
    platformVariants.threads = { posts: threadData.threads };
    console.log(`CrossPlatformAdapter berhasil menyusun varian platform.`);
  } catch (e) {
    console.warn('Thread generator gagal, menggunakan fallback ringan.', e.message);
    const fallbackX = drafts.title + '\n\n' + drafts.caption.substring(0, 200) + '...\n\nBaca selengkapnya di utas berikut.';
    platformVariants.x = { posts: [fallbackX] };
    platformVariants.threads = { posts: [fallbackX] };
  }

  return platformVariants;
}
