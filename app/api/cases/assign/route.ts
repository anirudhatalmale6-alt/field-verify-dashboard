import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// POST /api/cases/assign — assign cases to an executive
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { case_ids, executive_id } = await request.json();

    if (!case_ids || !Array.isArray(case_ids) || !executive_id) {
      return NextResponse.json({ error: 'case_ids (array) and executive_id required' }, { status: 400 });
    }

    const db = getDb();

    // Verify executive exists
    const exec = db.prepare('SELECT id, name, phone FROM users WHERE id = ? AND role = ?').get(executive_id, 'executive') as { id: string; name: string; phone: string | null } | undefined;
    if (!exec) {
      return NextResponse.json({ error: 'Executive not found' }, { status: 404 });
    }

    const updateCase = db.prepare(`UPDATE cases SET executive_id = ?, status = 'assigned', updated_at = datetime('now') WHERE id = ?`);
    const insertAudit = db.prepare(`INSERT INTO audit_trail (id, case_id, action, performed_by, details, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const assign = db.transaction((caseIds: string[]) => {
      let assigned = 0;
      for (const caseId of caseIds) {
        const existing = db.prepare('SELECT status, executive_id FROM cases WHERE id = ?').get(caseId) as { status: string; executive_id: string | null } | undefined;
        if (existing) {
          updateCase.run(executive_id, caseId);
          insertAudit.run(
            generateId('AUD'),
            caseId,
            'Case Assigned',
            user.name,
            `Assigned to ${exec.name}`,
            existing.status,
            'assigned'
          );
          assigned++;
        }
      }
      return assigned;
    });

    const assigned = assign(case_ids);

    // Fetch assigned case details for WhatsApp notification
    const assignedCases = case_ids.map((cId: string) => {
      const c = db.prepare('SELECT customer_name, address, contact_number, customer_category, fir_no, bank_name FROM cases WHERE id = ?').get(cId) as {
        customer_name: string; address: string; contact_number: string; customer_category: string; fir_no: string; bank_name: string;
      } | undefined;
      return c ? { fir_no: c.fir_no, customer_name: c.customer_name, address: c.address, contact_number: c.contact_number, customer_category: c.customer_category, bank_name: c.bank_name } : null;
    }).filter(Boolean);

    return NextResponse.json({ assigned, executive: exec.name, phone: exec.phone, cases: assignedCases });
  } catch (error) {
    console.error('Assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
