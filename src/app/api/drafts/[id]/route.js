import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // 1. Fetch draft to get image URL
    const { data: draft } = await supabaseAdmin
      .from('content_drafts_registry')
      .select('image_r2_url')
      .eq('id', id)
      .single();

    if (draft && draft.image_r2_url) {
      try {
        const urlParts = draft.image_r2_url.split('/');
        const fileName = urlParts[urlParts.length - 1]; // e.g. content-123.png
        
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName
        }));
      } catch (s3Error) {
        console.error('Failed to delete image from R2:', s3Error);
        // Continue to delete from DB even if image delete fails
      }
    }

    // 2. Delete from Database
    const { error } = await supabaseAdmin
      .from('content_drafts_registry')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Draft deleted permanently' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
