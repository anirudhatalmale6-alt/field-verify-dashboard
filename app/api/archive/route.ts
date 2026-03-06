import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import * as XLSX from 'xlsx';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';

// GET /api/archive?action=export&before=YYYY-MM-DD — export old data as ZIP (Excel + photos)
// GET /api/archive?action=stats — get archive stats (how much data before date)
// DELETE /api/archive?before=YYYY-MM-DD — purge old completed cases
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const beforeDate = searchParams.get('before') || '';

    const db = getDb();

    if (action === 'stats') {
      const total = db.prepare('SELECT COUNT(*) as cnt FROM cases').get() as { cnt: number };
      const totalReports = db.prepare('SELECT COUNT(*) as cnt FROM reports').get() as { cnt: number };
      const totalPhotos = db.prepare('SELECT COUNT(*) as cnt FROM photos').get() as { cnt: number };

      let archivable = { cases: 0, reports: 0, photos: 0 };
      if (beforeDate) {
        const ac = db.prepare(`SELECT COUNT(*) as cnt FROM cases WHERE date(imported_at) < ? AND status IN ('approved', 'rejected', 'submitted')`).get(beforeDate) as { cnt: number };
        const ar = db.prepare(`SELECT COUNT(*) as cnt FROM reports r JOIN cases c ON r.case_id = c.id WHERE date(c.imported_at) < ? AND c.status IN ('approved', 'rejected', 'submitted')`).get(beforeDate) as { cnt: number };
        const ap = db.prepare(`SELECT COUNT(*) as cnt FROM photos p JOIN reports r ON p.report_id = r.id JOIN cases c ON r.case_id = c.id WHERE date(c.imported_at) < ? AND c.status IN ('approved', 'rejected', 'submitted')`).get(beforeDate) as { cnt: number };
        archivable = { cases: ac.cnt, reports: ar.cnt, photos: ap.cnt };
      }

      return NextResponse.json({
        total: { cases: total.cnt, reports: totalReports.cnt, photos: totalPhotos.cnt },
        archivable,
      });
    }

    if (action === 'export') {
      if (!beforeDate) {
        return NextResponse.json({ error: 'before date required' }, { status: 400 });
      }

      // Query all archivable data
      const cases = db.prepare(`
        SELECT c.*, u.name as executive_name, u.region as executive_region
        FROM cases c
        LEFT JOIN users u ON c.executive_id = u.id
        WHERE date(c.imported_at) < ?
        AND c.status IN ('approved', 'rejected', 'submitted')
        ORDER BY c.imported_at
      `).all(beforeDate) as Record<string, unknown>[];

      const reports = db.prepare(`
        SELECT r.*, c.fir_no, c.customer_name
        FROM reports r
        JOIN cases c ON r.case_id = c.id
        WHERE date(c.imported_at) < ?
        AND c.status IN ('approved', 'rejected', 'submitted')
        ORDER BY r.submitted_at
      `).all(beforeDate) as Record<string, unknown>[];

      const photos = db.prepare(`
        SELECT p.*, r.case_id, c.fir_no
        FROM photos p
        JOIN reports r ON p.report_id = r.id
        JOIN cases c ON r.case_id = c.id
        WHERE date(c.imported_at) < ?
        AND c.status IN ('approved', 'rejected', 'submitted')
      `).all(beforeDate) as Record<string, unknown>[];

      const auditTrail = db.prepare(`
        SELECT a.*
        FROM audit_trail a
        JOIN cases c ON a.case_id = c.id
        WHERE date(c.imported_at) < ?
        AND c.status IN ('approved', 'rejected', 'submitted')
        ORDER BY a.performed_at
      `).all(beforeDate) as Record<string, unknown>[];

      // Build Excel workbook
      const wb = XLSX.utils.book_new();

      // Cases sheet
      const casesData = cases.map((c, i) => ({
        'Sr.': i + 1,
        'FIR No': c.fir_no,
        'Bank': c.bank_name,
        'Customer': c.customer_name,
        'Applicant': c.applicant,
        'Address': c.address,
        'Location': c.location,
        'Contact': c.contact_number,
        'Category': c.customer_category,
        'Purpose': c.purpose_of_loan,
        'Amount': c.finance_amount,
        'Executive': c.executive_name || 'Unassigned',
        'Region': c.executive_region || '',
        'Status': c.status,
        'Imported At': c.imported_at,
        'Updated At': c.updated_at,
        'Batch': c.import_batch,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(casesData), 'Cases');

      // Reports sheet
      if (reports.length > 0) {
        const reportsData = reports.map((r, i) => ({
          'Sr.': i + 1,
          'FIR No': r.fir_no,
          'Customer': r.customer_name,
          'Status': r.status,
          'Address Confirmed': r.address_confirmed ? 'YES' : 'NO',
          'Person Met': r.person_met || '',
          'RVR/BVR': r.rvr_or_bvr || '',
          'Area': r.area_of_house || '',
          'House Type': r.type_of_house || '',
          'Ownership': r.ownership_details || '',
          'Staying Years': r.staying_years || '',
          'Family Members': r.family_members || '',
          'Earning Members': r.earning_members || '',
          'Occupation': r.customer_occ_category || '',
          'Company': r.company_name || '',
          'Designation': r.designation || '',
          'Business': r.business_name_address || '',
          'Nature': r.nature_of_business || '',
          'TPC/Neighbour': r.tpc_neighbour_name || '',
          'Remarks': r.special_remarks || '',
          'GPS': r.latitude && r.longitude ? `${r.latitude},${r.longitude}` : '',
          'Submitted At': r.submitted_at || '',
          'Approved At': r.approved_at || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportsData), 'Reports');
      }

      // Photos sheet (metadata)
      if (photos.length > 0) {
        const photosData = photos.map((p, i) => ({
          'Sr.': i + 1,
          'FIR No': p.fir_no,
          'Folder': `photos/${p.fir_no}/`,
          'Filename': p.filename,
          'Original Name': p.original_name,
          'Label': p.label || '',
          'GPS': p.latitude && p.longitude ? `${p.latitude},${p.longitude}` : '',
          'Captured': p.captured_at || '',
          'Uploaded': p.uploaded_at || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(photosData), 'Photos');
      }

      // Audit trail sheet
      if (auditTrail.length > 0) {
        const auditData = auditTrail.map((a, i) => ({
          'Sr.': i + 1,
          'Case ID': a.case_id,
          'Action': a.action,
          'By': a.performed_by,
          'Details': a.details,
          'Date': a.performed_at,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditData), 'Audit Trail');
      }

      const excelBuffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

      // If no photos, just return the Excel file directly
      if (photos.length === 0) {
        return new NextResponse(new Uint8Array(excelBuffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="KOSPL_Archive_before_${beforeDate}.xlsx"`,
          },
        });
      }

      // Create ZIP with Excel + photo files organized by FIR number
      const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 5 } });
        const chunks: Buffer[] = [];
        const passthrough = new PassThrough();

        passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
        passthrough.on('end', () => resolve(Buffer.concat(chunks)));
        passthrough.on('error', reject);
        archive.on('error', reject);

        archive.pipe(passthrough);

        // Add Excel file to ZIP
        archive.append(excelBuffer, { name: `KOSPL_Archive_before_${beforeDate}.xlsx` });

        // Add photo files organized by FIR number
        // Photos are stored at data/uploads/{report_id}/{filename}
        const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
        for (const photo of photos) {
          const reportId = String(photo.report_id || '');
          const filename = String(photo.filename || '');
          // Try with report_id subdirectory first (correct path)
          let filePath = path.join(uploadsDir, reportId, filename);
          if (!fs.existsSync(filePath)) {
            // Fallback: try directly in uploads dir
            filePath = path.join(uploadsDir, filename);
          }
          if (fs.existsSync(filePath)) {
            const firNo = String(photo.fir_no || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
            const originalName = String(photo.original_name || photo.filename);
            archive.file(filePath, { name: `photos/${firNo}/${originalName}` });
          }
        }

        archive.finalize();
      });

      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="KOSPL_Archive_before_${beforeDate}.zip"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Archive error:', error);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}

// DELETE /api/archive?before=YYYY-MM-DD — purge old completed cases
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('before') || '';

    if (!beforeDate) {
      return NextResponse.json({ error: 'before date required' }, { status: 400 });
    }

    const db = getDb();

    // Only purge completed cases (approved/rejected/submitted)
    const casesToPurge = db.prepare(`
      SELECT c.id FROM cases c
      WHERE date(c.imported_at) < ?
      AND c.status IN ('approved', 'rejected', 'submitted')
    `).all(beforeDate) as { id: string }[];

    const caseIds = casesToPurge.map(c => c.id);
    if (caseIds.length === 0) {
      return NextResponse.json({ message: 'No cases to purge', deleted: { cases: 0, reports: 0, photos: 0 } });
    }

    let deletedPhotos = 0;
    let deletedReports = 0;

    const txn = db.transaction(() => {
      for (const caseId of caseIds) {
        // Delete photo files from disk
        const photos = db.prepare('SELECT p.filename FROM photos p JOIN reports r ON p.report_id = r.id WHERE r.case_id = ?').all(caseId) as { filename: string }[];
        for (const photo of photos) {
          try {
            const filePath = path.join(process.cwd(), 'data', 'uploads', photo.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch { /* ignore file delete errors */ }
          deletedPhotos++;
        }

        // Delete DB records (order matters for FK constraints)
        const reports = db.prepare('SELECT id FROM reports WHERE case_id = ?').all(caseId) as { id: string }[];
        for (const r of reports) {
          db.prepare('DELETE FROM audit_trail WHERE report_id = ?').run(r.id);
          db.prepare('DELETE FROM photos WHERE report_id = ?').run(r.id);
        }
        db.prepare('DELETE FROM audit_trail WHERE case_id = ?').run(caseId);
        db.prepare('DELETE FROM reports WHERE case_id = ?').run(caseId);
        db.prepare('DELETE FROM cases WHERE id = ?').run(caseId);
        deletedReports += reports.length;
      }
    });

    txn();

    // Vacuum to reclaim disk space
    db.exec('VACUUM');

    return NextResponse.json({
      message: `Purged ${caseIds.length} cases before ${beforeDate}`,
      deleted: { cases: caseIds.length, reports: deletedReports, photos: deletedPhotos },
    });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
  }
}
