import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/notifications?since=ISO_TIMESTAMP — get new submissions since timestamp
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || '';

    const db = getDb();

    if (!since) {
      // Return latest report timestamp for initial sync
      const latest = db.prepare(`
        SELECT submitted_at FROM reports ORDER BY submitted_at DESC LIMIT 1
      `).get() as { submitted_at: string } | undefined;

      return NextResponse.json({
        lastCheck: latest?.submitted_at || new Date().toISOString(),
        newReports: [],
      });
    }

    // Find reports submitted after the given timestamp
    const newReports = db.prepare(`
      SELECT r.id, r.customer_name, r.status, r.submitted_at,
        c.fir_no, u.name as executive_name
      FROM reports r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.executive_id = u.id
      WHERE r.submitted_at > ?
      ORDER BY r.submitted_at DESC
    `).all(since) as { id: string; customer_name: string; status: string; submitted_at: string; fir_no: string; executive_name: string }[];

    return NextResponse.json({
      lastCheck: newReports.length > 0 ? newReports[0].submitted_at : since,
      newReports,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
