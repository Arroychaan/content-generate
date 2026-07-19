export async function publishToInstagram(imageUrl, caption) {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    throw new Error('INSTAGRAM_ACCOUNT_ID atau INSTAGRAM_ACCESS_TOKEN tidak dikonfigurasi. Auto-post dibatalkan.');
  }

  try {
    // 1. Create a Media Container
    console.log(`Mengunggah gambar ke Instagram Container...`);
    const containerUrl = `https://graph.facebook.com/v20.0/${accountId}/media`;
    
    // Pastikan caption disesuaikan agar tidak melanggar batas URL limit
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrl);
    formData.append('caption', caption);
    formData.append('access_token', accessToken);

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      body: formData,
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || containerData.error) {
      throw new Error(`Gagal membuat media container: ${containerData.error?.message || JSON.stringify(containerData)}`);
    }

    const creationId = containerData.id;
    console.log(`Container berhasil dibuat (ID: ${creationId}). Menunggu publikasi...`);

    // 2. Publish the Media Container
    const publishUrl = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
    const publishFormData = new URLSearchParams();
    publishFormData.append('creation_id', creationId);
    publishFormData.append('access_token', accessToken);

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      body: publishFormData,
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || publishData.error) {
      throw new Error(`Gagal mempublikasikan media: ${publishData.error?.message || JSON.stringify(publishData)}`);
    }

    console.log(`Berhasil publish ke Instagram! ID Post: ${publishData.id}`);
    return publishData.id;
  } catch (error) {
    console.error('Error in InstagramGraphClient:', error);
    throw error;
  }
}
