import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const executives = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.phone, u.avatar, u.region, u.is_active,
        COUNT(DISTINCT c.id) as total_cases,
        COUNT(DISTINCT r.id) as total_reports,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports,
        SUM(CASE WHEN r.status = 'pending' OR r.status = 'in_review' THEN 1 ELSE 0 END) as pending_reports
      FROM users u
      LEFT JOIN cases c ON c.executive_id = u.id
      LEFT JOIN reports r ON r.executive_id = u.id
      WHERE u.role = 'executive'
      GROUP BY u.id
      ORDER BY total_reports DESC
    `).all();

    return NextResponse.json({ executives });
  } catch (error) {
    console.error('Executives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
