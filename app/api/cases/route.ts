import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/cases — list all cases with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get('id');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const executiveId = searchParams.get('executive_id');
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    const db = getDb();

    // Single case fetch
    if (singleId) {
      const c = db.prepare(`
        SELECT c.*, u.name as executive_name
        FROM cases c
        LEFT JOIN users u ON c.executive_id = u.id
        WHERE c.id = ?
      `).get(singleId);
      if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      return NextResponse.json({ case: c });
    }

    let query = `
      SELECT c.*, u.name as executive_name
      FROM cases c
      LEFT JOIN users u ON c.executive_id = u.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (status && status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (category && category !== 'all') {
      query += ` AND c.customer_category = ?`;
      params.push(category);
    }
    if (executiveId) {
      // For executive app — only show their cases
      query += ` AND c.executive_id = ?`;
      params.push(executiveId);
    } else if (user.role === 'executive') {
      query += ` AND c.executive_id = ?`;
      params.push(user.id);
    }
    if (search) {
      query += ` AND (c.id LIKE ? OR c.customer_name LIKE ? OR c.fir_no LIKE ? OR c.bank_name LIKE ? OR c.location LIKE ? OR c.applicant LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    query += ` ORDER BY c.imported_at DESC`;

    let cases = db.prepare(query).all(...params) as Record<string, unknown>[];

    // Sort by distance if user coordinates provided
    if (userLat !== null && userLng !== null) {
      cases = cases.map(c => {
        const cLat = c.latitude as number | null;
        const cLng = c.longitude as number | null;
        let distance = 999999;
        if (cLat && cLng && cLat !== 0 && cLng !== 0) {
          // Haversine formula
          const R = 6371;
          const dLat = ((cLat - userLat) * Math.PI) / 180;
          const dLon = ((cLng - userLng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((cLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        return { ...c, distance: Math.round(distance * 10) / 10 };
      });
      cases.sort((a, b) => (a.distance as number) - (b.distance as number));
    }

    // Status counts
    const counts = db.prepare(`
      SELECT status, COUNT(*) as count FROM cases GROUP BY status
    `).all() as { status: string; count: number }[];

    const statusCounts: Record<string, number> = { all: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c.count;
      statusCounts.all += c.count;
    });

    return NextResponse.json({ cases, statusCounts });
  } catch (error) {
    console.error('Cases error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cases — create a single case (or batch from Excel)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDb();

    // Batch import
    if (Array.isArray(body.cases)) {
      const batchId = generateId('BATCH');
      const insert = db.prepare(`
        INSERT INTO cases (id, bank_name, date_and_time, fir_no, applicant, purpose_of_loan, finance_amount, customer_name, address, location, contact_number, executive_id, customer_category, status, import_batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let imported = 0;
      let failed = 0;

      const insertBatch = db.transaction((cases: Record<string, string>[]) => {
        for (const c of cases) {
          try {
            const execId = c.executive_name
              ? (db.prepare('SELECT id FROM users WHERE name = ? AND role = ?').get(c.executive_name, 'executive') as { id: string } | undefined)?.id || null
              : null;

            insert.run(
              generateId('CASE'),
              c.bank_name || '',
              c.date_and_time || null,
              c.fir_no || '',
              c.applicant || '',
              c.purpose_of_loan || '',
              c.finance_amount || '',
              c.customer_name || '',
              c.address || '',
              c.location || '',
              c.contact_number || '',
              execId,
              c.customer_category || 'HOME',
              execId ? 'assigned' : 'unassigned',
              batchId,
            );
            imported++;
          } catch (e) {
            console.error('Row import error:', e);
            failed++;
          }
        }
      });

      insertBatch(body.cases);

      // Log the batch
      db.prepare(`INSERT INTO import_batches (id, filename, total_rows, imported_rows, failed_rows, imported_by) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(batchId, body.filename || 'upload.xlsx', body.cases.length, imported, failed, user.id);

      return NextResponse.json({ batchId, imported, failed, total: body.cases.length }, { status: 201 });
    }

    // Single case creation (manual add)
    if (body.customer_name || body.fir_no) {
      const caseId = generateId('CASE');
      const execId = body.executive_id || null;

      db.prepare(`
        INSERT INTO cases (id, bank_name, date_and_time, fir_no, applicant, purpose_of_loan, finance_amount, customer_name, address, location, contact_number, executive_id, customer_category, status, import_batch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        caseId,
        body.bank_name || 'Unknown',
        body.date_and_time || null,
        body.fir_no || `FIR-${Date.now()}`,
        body.applicant || '',
        body.purpose_of_loan || '',
        body.finance_amount || '',
        body.customer_name || 'Unknown',
        body.address || '',
        body.location || '',
        body.contact_number || '',
        execId,
        body.customer_category || 'HOME',
        execId ? 'assigned' : 'unassigned',
        'MANUAL',
      );

      // Audit trail
      db.prepare(`INSERT INTO audit_trail (id, case_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?)`)
        .run(generateId('AUD'), caseId, 'Case Created Manually', user.name || user.id, `Manual case entry by admin`);

      return NextResponse.json({ caseId, message: 'Case created successfully' }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Case create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/cases — update admin_instructions for a case
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { case_id, admin_instructions } = await request.json();
    if (!case_id) {
      return NextResponse.json({ error: 'case_id required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('UPDATE cases SET admin_instructions = ?, updated_at = datetime(?) WHERE id = ?')
      .run(admin_instructions || '', new Date().toISOString(), case_id);

    db.prepare(`INSERT INTO audit_trail (id, case_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?)`)
      .run(generateId('AUD'), case_id, 'Instructions Updated', user.name, `Admin instructions: ${admin_instructions || '(cleared)'}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Case update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
