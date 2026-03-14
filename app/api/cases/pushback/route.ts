import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id, reason } = await request.json();

    if (!case_id || !reason) {
      return NextResponse.json({ error: 'case_id and reason are required' }, { status: 400 });
    }

    const db = getDb();

    // Verify the case belongs to this executive
    const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(case_id) as { id: string; executive_id: string; status: string } | undefined;
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (user.role === 'executive' && caseRow.executive_id !== user.id) {
      return NextResponse.json({ error: 'Not your case' }, { status: 403 });
    }

    // Push back: unassign the case, store reason, and set to unassigned
    db.prepare('UPDATE cases SET executive_id = NULL, status = ?, pushback_reason = ?, updated_at = datetime(?) WHERE id = ?')
      .run('unassigned', reason, new Date().toISOString(), case_id);

    // Log audit trail
    db.prepare(`INSERT INTO audit_trail (id, case_id, action, performed_by, details, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(
        generateId('AUD'),
        case_id,
        'Case Pushed Back',
        user.name,
        `Case pushed back by ${user.name}. Reason: ${reason}`,
        'assigned',
        'unassigned'
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pushback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
