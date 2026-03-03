import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const db = getDb();

    let query = `
      SELECT a.*,
        r.customer_name,
        c.fir_no as case_fir
      FROM audit_trail a
      LEFT JOIN reports r ON a.report_id = r.id
      LEFT JOIN cases c ON a.case_id = c.id OR r.case_id = c.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (action && action !== 'all') {
      query += ` AND LOWER(a.action) LIKE ?`;
      params.push(`%${action}%`);
    }

    query += ` ORDER BY a.performed_at DESC LIMIT 100`;

    const entries = db.prepare(query).all(...params);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
