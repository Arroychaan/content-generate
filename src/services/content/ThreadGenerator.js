export function generateDeepThreads(mainNews, dataPoints, analysis, hookImageUrl) {
  // Post 1: The Hook
  const post1 = `${mainNews.substring(0, 250)}... 🧵👇`;
  
  // Post 2-4: The Data Core
  const dataPosts = dataPoints.slice(0, 3).map((point, i) => {
    return `${i + 2}/ 📊 ${point.substring(0, 260)}`;
  });

  // Fill up if dataPoints < 3
  while (dataPosts.length < 3) {
    dataPosts.push(`${dataPosts.length + 2}/ 📌 (Data terisolasi tambahan)`);
  }

  // Post 5: The Analysis
  const post5 = `5/ 🧠 Analisis: ${analysis.substring(0, 250)}`;

  // Post 6: Organic CTA
  const post6 = `6/ 🗣️ Bagaimana pendapatmu tentang ini? Bagikan pandanganmu di bawah! 👇`;

  return [post1, ...dataPosts, post5, post6];
}
