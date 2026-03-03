import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';

// GET /api/photos/[id] — serve a photo file
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as {
      id: string; report_id: string; filename: string; original_name: string;
    } | undefined;

    if (!photo) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'data', 'uploads', photo.report_id, photo.filename);

    try {
      const buffer = await readFile(filePath);
      const ext = photo.filename.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return new NextResponse('Photo file not found on disk', { status: 404 });
    }
  } catch (error) {
    console.error('Photo serve error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
