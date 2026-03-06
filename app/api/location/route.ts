import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

// POST: Executive reports their location
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { latitude, longitude } = await request.json();

  if (!latitude || !longitude) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`UPDATE users SET last_latitude = ?, last_longitude = ?, last_location_at = datetime('now') WHERE id = ?`)
    .run(latitude, longitude, user.id);

  return NextResponse.json({ success: true });
}

// GET: Admin fetches all executive locations
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const executives = db.prepare(`
    SELECT id, name, avatar, region, phone, last_latitude, last_longitude, last_location_at,
      (SELECT COUNT(*) FROM cases WHERE executive_id = users.id AND status IN ('assigned', 'in_progress')) as active_cases
    FROM users
    WHERE role = 'executive' AND is_active = 1 AND last_latitude IS NOT NULL
    ORDER BY last_location_at DESC
  `).all();

  return NextResponse.json({ executives });
}
