import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import piexif from 'piexifjs';

// Convert decimal degrees to EXIF GPS format (degrees, minutes, seconds as rationals)
function decimalToDMS(dd: number): [[number, number], [number, number], [number, number]] {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60 * 100); // * 100 for 2 decimal precision
  return [[deg, 1], [min, 1], [sec, 100]];
}

// Embed GPS coordinates into JPEG EXIF data
function embedGpsExif(buffer: Buffer, lat: number, lng: number): Buffer {
  try {
    const base64 = buffer.toString('binary');
    const data = `data:image/jpeg;base64,${Buffer.from(base64, 'binary').toString('base64')}`;

    const gpsIfd: Record<string, unknown> = {
      [piexif.GPSIFD.GPSLatitudeRef]: lat >= 0 ? 'N' : 'S',
      [piexif.GPSIFD.GPSLatitude]: decimalToDMS(lat),
      [piexif.GPSIFD.GPSLongitudeRef]: lng >= 0 ? 'E' : 'W',
      [piexif.GPSIFD.GPSLongitude]: decimalToDMS(lng),
      [piexif.GPSIFD.GPSAltitudeRef]: 0,
      [piexif.GPSIFD.GPSAltitude]: [0, 1],
    };

    const now = new Date();
    const dateStamp = `${now.getFullYear()}:${String(now.getMonth() + 1).padStart(2, '0')}:${String(now.getDate()).padStart(2, '0')}`;
    const timeStamp = [[now.getHours(), 1], [now.getMinutes(), 1], [now.getSeconds(), 1]] as [[number, number], [number, number], [number, number]];
    gpsIfd[piexif.GPSIFD.GPSDateStamp] = dateStamp;
    gpsIfd[piexif.GPSIFD.GPSTimeStamp] = timeStamp;

    const exifObj = { GPS: gpsIfd };
    const exifBytes = piexif.dump(exifObj);
    const newData = piexif.insert(exifBytes, data);

    // Convert data URI back to Buffer
    const base64Data = newData.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } catch (err) {
    console.error('EXIF embed error (non-fatal):', err);
    return buffer; // Return original if EXIF embedding fails
  }
}

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

    // Ensure upload directory exists (data/ persists in production unlike public/)
    const uploadDir = path.join(process.cwd(), 'data', 'uploads', id);
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

      let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer;

      // Embed GPS EXIF data into JPEG photos
      const lat = latitudes[i] ? parseFloat(latitudes[i]) : null;
      const lng = longitudes[i] ? parseFloat(longitudes[i]) : null;
      if (lat && lat !== 0 && lng && lng !== 0 && (ext === 'jpg' || ext === 'jpeg')) {
        buffer = embedGpsExif(buffer, lat, lng) as Buffer;
      }

      // Save file
      await writeFile(path.join(uploadDir, filename), buffer);

      // Save to DB
      insertPhoto.run(
        photoId,
        id,
        filename,
        file.name,
        labels[i] || `Photo ${i + 1}`,
        (lat && lat !== 0) ? lat : null,
        (lng && lng !== 0) ? lng : null,
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

    const rawPhotos = db.prepare('SELECT * FROM photos WHERE report_id = ? ORDER BY captured_at ASC').all(id) as { id: string; report_id: string; filename: string; [key: string]: unknown }[];
    const photos = rawPhotos.map(p => ({
      ...p,
      file_path: `/api/photos/${p.id}`,
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Photos list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
