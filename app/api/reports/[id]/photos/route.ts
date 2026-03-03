import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/reports/[id]/photos — upload photos for a report
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    // Verify report exists
    const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    const labels = formData.getAll('labels') as string[];
    const latitudes = formData.getAll('latitudes') as string[];
    const longitudes = formData.getAll('longitudes') as string[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No photos uploaded' }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', id);
    await mkdir(uploadDir, { recursive: true });

    const insertPhoto = db.prepare(`
      INSERT INTO photos (id, report_id, filename, original_name, label, latitude, longitude, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const uploaded: { id: string; filename: string; label: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoId = generateId('PHT');
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${photoId}.${ext}`;

      // Save file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);

      // Save to DB
      insertPhoto.run(
        photoId,
        id,
        filename,
        file.name,
        labels[i] || `Photo ${i + 1}`,
        latitudes[i] ? parseFloat(latitudes[i]) : null,
        longitudes[i] ? parseFloat(longitudes[i]) : null,
      );

      uploaded.push({ id: photoId, filename, label: labels[i] || `Photo ${i + 1}` });
    }

    return NextResponse.json({ uploaded, count: uploaded.length }, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }
}

// GET /api/reports/[id]/photos — list photos for a report
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const photos = db.prepare('SELECT * FROM photos WHERE report_id = ? ORDER BY captured_at ASC').all(id);

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Photos list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
