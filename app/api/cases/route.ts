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
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const executiveId = searchParams.get('executive_id');

    const db = getDb();

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
      query += ` AND (c.customer_name LIKE ? OR c.fir_no LIKE ? OR c.bank_name LIKE ? OR c.location LIKE ? OR c.applicant LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY c.imported_at DESC`;

    const cases = db.prepare(query).all(...params);

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

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Case create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
