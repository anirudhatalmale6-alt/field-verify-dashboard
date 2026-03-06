import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// POST /api/geocode — batch geocode cases that don't have coordinates yet
// Called automatically when executive opens their cases list
export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Find cases without coordinates (limit to 5 per call to avoid rate limits)
    const ungeocodedCases = db.prepare(`
      SELECT id, address, location FROM cases
      WHERE latitude IS NULL AND (address != '' OR location != '')
      ORDER BY imported_at DESC
      LIMIT 5
    `).all() as { id: string; address: string; location: string }[];

    if (ungeocodedCases.length === 0) {
      return NextResponse.json({ geocoded: 0, remaining: 0 });
    }

    const updateStmt = db.prepare('UPDATE cases SET latitude = ?, longitude = ? WHERE id = ?');
    // Mark cases with empty coordinates so we don't retry them forever
    const markFailed = db.prepare('UPDATE cases SET latitude = 0, longitude = 0 WHERE id = ?');

    let geocoded = 0;

    for (const c of ungeocodedCases) {
      const addr = (c.address + (c.location ? ', ' + c.location : '')).trim();
      if (!addr) {
        markFailed.run(c.id);
        continue;
      }

      try {
        // Use Nominatim (free, no API key needed, 1 req/sec rate limit)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr + ', India')}&limit=1`,
          { headers: { 'User-Agent': 'KOSPL-FieldVerify/1.0' } }
        );
        const data = await res.json();

        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updateStmt.run(lat, lng, c.id);
          geocoded++;
        } else {
          // Try with just location/area name
          if (c.location) {
            const res2 = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(c.location + ', India')}&limit=1`,
              { headers: { 'User-Agent': 'KOSPL-FieldVerify/1.0' } }
            );
            const data2 = await res2.json();
            if (data2.length > 0) {
              updateStmt.run(parseFloat(data2[0].lat), parseFloat(data2[0].lon), c.id);
              geocoded++;
            } else {
              markFailed.run(c.id);
            }
            // Rate limit
            await new Promise(r => setTimeout(r, 1100));
          } else {
            markFailed.run(c.id);
          }
        }

        // Rate limit: 1 request per second (Nominatim policy)
        await new Promise(r => setTimeout(r, 1100));
      } catch {
        markFailed.run(c.id);
      }
    }

    // Count remaining
    const remaining = (db.prepare('SELECT COUNT(*) as c FROM cases WHERE latitude IS NULL AND (address != \'\' OR location != \'\')').get() as { c: number }).c;

    return NextResponse.json({ geocoded, remaining });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
