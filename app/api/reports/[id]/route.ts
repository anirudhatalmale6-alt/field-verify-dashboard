import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/reports/[id] — get a single report with all details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const report = db.prepare(`
      SELECT r.*,
        c.bank_name, c.fir_no, c.applicant, c.purpose_of_loan, c.finance_amount, c.customer_category,
        u.name as executive_name, u.avatar as executive_avatar, u.phone as executive_phone, u.region as executive_region
      FROM reports r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.executive_id = u.id
      WHERE r.id = ?
    `).get(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get photos
    const photos = db.prepare('SELECT * FROM photos WHERE report_id = ? ORDER BY captured_at ASC').all(id);

    // Get audit trail
    const auditTrail = db.prepare('SELECT * FROM audit_trail WHERE report_id = ? ORDER BY performed_at ASC').all(id);

    return NextResponse.json({ report, photos, auditTrail });
  } catch (error) {
    console.error('Report detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/reports/[id] — update report status or add notes
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT status, internal_notes FROM reports WHERE id = ?').get(id) as {
      status: string; internal_notes: string;
    } | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update status
    if (body.status) {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Only admin can update status' }, { status: 403 });
      }

      const updates: string[] = [`status = '${body.status}'`, `updated_at = datetime('now')`];

      if (body.status === 'in_review' || body.status === 'verified') {
        updates.push(`reviewed_at = datetime('now')`);
      }
      if (body.status === 'approved') {
        updates.push(`approved_at = datetime('now')`);
        // Update case status too
        const reportCase = db.prepare('SELECT case_id FROM reports WHERE id = ?').get(id) as { case_id: string };
        db.prepare(`UPDATE cases SET status = 'approved', updated_at = datetime('now') WHERE id = ?`).run(reportCase.case_id);
      }
      if (body.status === 'rejected') {
        const reportCase = db.prepare('SELECT case_id FROM reports WHERE id = ?').get(id) as { case_id: string };
        db.prepare(`UPDATE cases SET status = 'rejected', updated_at = datetime('now') WHERE id = ?`).run(reportCase.case_id);
      }

      db.prepare(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`).run(id);

      // Audit
      db.prepare(`INSERT INTO audit_trail (id, report_id, action, performed_by, details, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(generateId('AUD'), id, 'Status Changed', user.name, `Status changed to ${body.status}`, existing.status, body.status);
    }

    // Add internal note
    if (body.internal_note) {
      const currentNotes = existing.internal_notes || '';
      const newNotes = currentNotes ? `${currentNotes}\n---\n${body.internal_note}` : body.internal_note;
      db.prepare(`UPDATE reports SET internal_notes = ?, updated_at = datetime('now') WHERE id = ?`).run(newNotes, id);

      db.prepare(`INSERT INTO audit_trail (id, report_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?)`)
        .run(generateId('AUD'), id, 'Note Added', user.name, body.internal_note);
    }

    return NextResponse.json({ message: 'Report updated' });
  } catch (error) {
    console.error('Report update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
