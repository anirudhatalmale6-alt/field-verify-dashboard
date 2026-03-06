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

    // Total stats
    const totalCases = (db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number }).count;
    const totalReports = (db.prepare('SELECT COUNT(*) as count FROM reports').get() as { count: number }).count;
    const pendingReview = (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status IN ('pending', 'in_review')").get() as { count: number }).count;
    const approved = (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'approved'").get() as { count: number }).count;
    const rejected = (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'rejected'").get() as { count: number }).count;

    // Today's submissions
    const todayReports = (db.prepare("SELECT COUNT(*) as count FROM reports WHERE date(submitted_at) = date('now')").get() as { count: number }).count;

    // Weekly data (last 7 days)
    const weeklyData = db.prepare(`
      SELECT
        strftime('%w', submitted_at) as day_num,
        CASE strftime('%w', submitted_at)
          WHEN '0' THEN 'Sun'
          WHEN '1' THEN 'Mon'
          WHEN '2' THEN 'Tue'
          WHEN '3' THEN 'Wed'
          WHEN '4' THEN 'Thu'
          WHEN '5' THEN 'Fri'
          WHEN '6' THEN 'Sat'
        END as day,
        COUNT(*) as visits,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reports
      WHERE submitted_at >= datetime('now', '-7 days')
      GROUP BY day_num
      ORDER BY day_num
    `).all();

    // Top executives
    const topExecutives = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.region,
        COUNT(r.id) as total_visits,
        ROUND(AVG(
          CASE WHEN r.reviewed_at IS NOT NULL
          THEN (julianday(r.reviewed_at) - julianday(r.submitted_at)) * 24
          ELSE NULL END
        ), 1) as avg_tat
      FROM users u
      LEFT JOIN reports r ON r.executive_id = u.id
      WHERE u.role = 'executive'
      GROUP BY u.id
      ORDER BY total_visits DESC
      LIMIT 5
    `).all();

    // Recent reports
    const recentReports = db.prepare(`
      SELECT r.id, r.customer_name, r.address, r.contact_number, r.location, r.status, r.submitted_at,
        c.fir_no as case_id, c.purpose_of_loan, c.bank_name,
        u.name as executive_name
      FROM reports r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.executive_id = u.id
      ORDER BY r.submitted_at DESC
      LIMIT 5
    `).all();

    return NextResponse.json({
      stats: {
        totalCases,
        totalReports,
        pendingReview,
        approved,
        rejected,
        todayReports,
        avgTAT: 4.5, // Will be calculated from real data once there are enough reports
      },
      weeklyData: weeklyData.length > 0 ? weeklyData : [
        { day: 'Mon', visits: 0, approved: 0, rejected: 0 },
        { day: 'Tue', visits: 0, approved: 0, rejected: 0 },
        { day: 'Wed', visits: 0, approved: 0, rejected: 0 },
        { day: 'Thu', visits: 0, approved: 0, rejected: 0 },
        { day: 'Fri', visits: 0, approved: 0, rejected: 0 },
        { day: 'Sat', visits: 0, approved: 0, rejected: 0 },
        { day: 'Sun', visits: 0, approved: 0, rejected: 0 },
      ],
      topExecutives,
      recentReports,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
