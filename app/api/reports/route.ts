import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/reports — list reports with filters
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

    const db = getDb();

    let query = `
      SELECT r.*,
        c.bank_name, c.fir_no, c.reference_number, c.applicant, c.purpose_of_loan, c.finance_amount, c.customer_category,
        u.name as executive_name, u.avatar as executive_avatar,
        (SELECT COUNT(*) FROM photos p WHERE p.report_id = r.id) as photo_count
      FROM reports r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.executive_id = u.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (user.role === 'executive') {
      query += ` AND r.executive_id = ?`;
      params.push(user.id);
    }
    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (category && category !== 'all') {
      query += ` AND c.customer_category = ?`;
      params.push(category);
    }
    if (search) {
      query += ` AND (LOWER(r.customer_name) LIKE LOWER(?) OR c.fir_no LIKE ? OR LOWER(c.bank_name) LIKE LOWER(?) OR LOWER(r.location) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?) OR c.reference_number LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    query += ` ORDER BY r.submitted_at DESC`;

    const reports = db.prepare(query).all(...params);

    // Status counts
    let countQuery = `SELECT r.status, COUNT(*) as count FROM reports r`;
    if (user.role === 'executive') {
      countQuery += ` WHERE r.executive_id = '${user.id}'`;
    }
    countQuery += ` GROUP BY r.status`;
    const counts = db.prepare(countQuery).all() as { status: string; count: number }[];

    const statusCounts: Record<string, number> = { all: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c.count;
      statusCounts.all += c.count;
    });

    return NextResponse.json({ reports, statusCounts });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reports — submit a new verification report
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    // Verify case exists and is assigned
    const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(body.case_id) as { id: string; status: string; executive_id: string } | undefined;
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Allow executive or admin to submit
    if (user.role === 'executive' && caseRow.executive_id !== user.id) {
      return NextResponse.json({ error: 'This case is not assigned to you' }, { status: 403 });
    }

    // Prevent duplicate submission — check if a report already exists for this case
    const existingReport = db.prepare('SELECT id, status FROM reports WHERE case_id = ?').get(body.case_id) as { id: string; status: string } | undefined;
    if (existingReport) {
      if (existingReport.status === 'approved') {
        return NextResponse.json({ error: 'This case already has an approved report. Duplicate submission not allowed.' }, { status: 409 });
      }
      if (existingReport.status !== 'rejected' && user.role !== 'admin') {
        return NextResponse.json({ error: 'A report already exists for this case. Contact admin to allow re-submission.' }, { status: 409 });
      }
      // If rejected or admin override, delete the old report to allow re-submission
      if (existingReport.status === 'rejected' || user.role === 'admin') {
        db.prepare('DELETE FROM photos WHERE report_id = ?').run(existingReport.id);
        db.prepare('DELETE FROM reports WHERE id = ?').run(existingReport.id);
      }
    }

    const reportId = generateId('RPT');
    const executiveId = user.role === 'executive' ? user.id : (body.executive_id || caseRow.executive_id);

    db.prepare(`
      INSERT INTO reports (
        id, case_id, executive_id, status,
        fir_report_given_by, fir_reference_number, customer_name, address_confirmed,
        person_met, landmark, rvr_or_bvr, address, location, contact_number, latitude, longitude,
        dob_or_age, area_of_house, type_of_house, area_in_sqft, ownership_details,
        rented_owner_name, staying_years, family_members, earning_members,
        spouse_occupation, spouse_occupation_details, customer_occ_category,
        company_name, company_address, designation, years_working,
        business_name_address, office_ownership, nature_of_business, years_in_business,
        office_location, office_area_sqft, office_setup_seen, employees_seen,
        company_name_board, tpc_neighbour_name, special_remarks
      ) VALUES (
        ?, ?, ?, 'pending',
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      reportId, body.case_id, executiveId,
      '', body.fir_reference_number || '', body.customer_name || '', body.address_confirmed ? 1 : 0,
      body.person_met || '', body.landmark || '', body.rvr_or_bvr || 'RVR', body.address || '', body.location || '', body.contact_number || '', body.latitude || null, body.longitude || null,
      body.dob_or_age || '', body.area_of_house || '', JSON.stringify(body.type_of_house || []), body.area_in_sqft || '', body.ownership_details || '',
      body.rented_owner_name || '', body.staying_years || '', body.family_members || '', body.earning_members || '',
      body.spouse_occupation || '', body.spouse_occupation_details || '', body.customer_occ_category || 'SALARIED',
      body.company_name || '', body.company_address || '', body.designation || '', body.years_working || '',
      body.business_name_address || '', body.office_ownership || '', body.nature_of_business || '', body.years_in_business || '',
      body.office_location || '', body.office_area_sqft || '', body.office_setup_seen || '', body.employees_seen || '',
      body.company_name_board || '', body.tpc_neighbour_name || '', body.special_remarks || ''
    );

    // Auto-copy special_remarks to internal_notes
    if (body.special_remarks) {
      db.prepare(`UPDATE reports SET internal_notes = ? WHERE id = ?`).run(body.special_remarks, reportId);
    }

    // Update case status
    db.prepare(`UPDATE cases SET status = 'submitted', updated_at = datetime('now') WHERE id = ?`).run(body.case_id);

    // Audit trail
    db.prepare(`INSERT INTO audit_trail (id, report_id, case_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(generateId('AUD'), reportId, body.case_id, 'Report Submitted', user.name, 'Field visit completed and report submitted');

    return NextResponse.json({ id: reportId, message: 'Report submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Report submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
