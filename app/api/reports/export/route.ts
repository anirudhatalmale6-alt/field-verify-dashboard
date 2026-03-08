import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

// GET /api/reports/export?type=daily|full&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    const db = getDb();
    const wb = XLSX.utils.book_new();
    const baseUrl = request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://app.kospl.in';

    if (type === 'daily') {
      // Daily MIS — only reports submitted today (or within date range)
      let timeFilter = `AND date(r.submitted_at) = date('now')`;
      if (fromDate && toDate) {
        timeFilter = `AND date(r.submitted_at) >= '${fromDate}' AND date(r.submitted_at) <= '${toDate}'`;
      } else if (fromDate) {
        timeFilter = `AND date(r.submitted_at) >= '${fromDate}'`;
      } else if (toDate) {
        timeFilter = `AND date(r.submitted_at) <= '${toDate}'`;
      }

      const reports = db.prepare(`
        SELECT
          c.fir_no, c.bank_name, c.customer_name, c.applicant, c.address, c.location,
          c.contact_number, c.customer_category, c.purpose_of_loan, c.finance_amount,
          c.date_and_time, c.district, c.reference_number, c.pincode,
          u.name as executive_name, u.region as executive_region,
          r.status as report_status, r.address_confirmed, r.person_met, r.rvr_or_bvr,
          r.area_of_house, r.type_of_house, r.ownership_details, r.staying_years,
          r.family_members, r.earning_members, r.customer_occ_category,
          r.company_name, r.designation, r.business_name_address, r.nature_of_business,
          r.tpc_neighbour_name, r.special_remarks, r.latitude, r.longitude,
          r.summary_remarks, r.verification_result, r.approved_by,
          r.id as report_id, r.submitted_at, r.approved_at,
          (SELECT COUNT(*) FROM photos p WHERE p.report_id = r.id) as photo_count
        FROM reports r
        JOIN cases c ON r.case_id = c.id
        LEFT JOIN users u ON r.executive_id = u.id
        WHERE 1=1 ${timeFilter}
        ORDER BY r.submitted_at DESC
      `).all() as Record<string, unknown>[];

      // Get photo URLs for each report
      const photosByReport: Record<string, string[]> = {};
      for (const r of reports) {
        const rid = String(r.report_id);
        const photos = db.prepare('SELECT filename, original_name FROM photos WHERE report_id = ?').all(rid) as { filename: string; original_name: string }[];
        photosByReport[rid] = photos.map(p => `${baseUrl}/api/photos/${p.filename}`);
      }

      const wsData = reports.map((r, i) => {
        const rid = String(r.report_id);
        const urls = photosByReport[rid] || [];
        const row: Record<string, unknown> = {
          'Sr. No': i + 1,
          'Company Name': r.bank_name,
          'Reference Number': r.reference_number || '',
          'Date & Time': r.date_and_time || '',
          'FIR No': r.fir_no,
          'Customer Category': r.customer_category,
          'Purpose of Loan': r.purpose_of_loan,
          'Loan Amount': r.finance_amount,
          'Customer Name': r.customer_name,
          'Applicant': r.applicant,
          'Address': r.address,
          'Pin Code': r.pincode || '',
          'Location': r.location,
          'Contact Number': r.contact_number,
          'Special Remarks': r.special_remarks || '',
          'Summary Remarks': r.summary_remarks || '',
          'Verification Result': r.verification_result || '',
          'Field Executive': r.executive_name,
          'Executive Region': r.executive_region,
          'Report Status': r.report_status,
          'Address Confirmed': r.address_confirmed ? 'YES' : 'NO',
          'Person Met': r.person_met || '',
          'RVR/BVR': r.rvr_or_bvr || '',
          'Area': r.area_of_house || '',
          'House Type': r.type_of_house || '',
          'Ownership': r.ownership_details || '',
          'Staying Years': r.staying_years || '',
          'Family Members': r.family_members || '',
          'Occupation': r.customer_occ_category || '',
          'Company': r.company_name || r.business_name_address || '',
          'Designation': r.designation || r.nature_of_business || '',
          'TPC/Neighbour': r.tpc_neighbour_name || '',
          'GPS': r.latitude && r.longitude ? `${r.latitude},${r.longitude}` : '',
          'Photos': r.photo_count,
          'Submitted by Maker At': r.submitted_at || '',
          'Submitted by Checker At': r.approved_at || '',
          'Checker Name': r.approved_by || '',
        };
        // Add photo URL columns
        for (let p = 0; p < Math.max(urls.length, 4); p++) {
          row[`Photo ${p + 1} URL`] = urls[p] || '';
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 18 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Daily MIS');

    } else {
      // Full MIS — ALL cases data (with or without reports)
      let timeFilter = '';
      if (fromDate && toDate) {
        timeFilter = `AND date(c.imported_at) >= '${fromDate}' AND date(c.imported_at) <= '${toDate}'`;
      } else if (fromDate) {
        timeFilter = `AND date(c.imported_at) >= '${fromDate}'`;
      } else if (toDate) {
        timeFilter = `AND date(c.imported_at) <= '${toDate}'`;
      }

      const cases = db.prepare(`
        SELECT
          c.id, c.fir_no, c.bank_name, c.customer_name, c.applicant, c.address, c.location,
          c.contact_number, c.customer_category, c.purpose_of_loan, c.finance_amount,
          c.date_and_time, c.district, c.reference_number, c.pincode,
          c.status as case_status, c.imported_at,
          u.name as executive_name, u.region as executive_region,
          r.id as report_id, r.status as report_status, r.address_confirmed, r.person_met,
          r.rvr_or_bvr, r.special_remarks, r.submitted_at, r.approved_at,
          r.latitude, r.longitude,
          r.summary_remarks, r.verification_result, r.approved_by,
          (SELECT COUNT(*) FROM photos p WHERE p.report_id = r.id) as photo_count
        FROM cases c
        LEFT JOIN users u ON c.executive_id = u.id
        LEFT JOIN reports r ON r.case_id = c.id
        WHERE 1=1 ${timeFilter}
        ORDER BY c.imported_at DESC
      `).all() as Record<string, unknown>[];

      // Get photo URLs for cases with reports
      const fullPhotosByReport: Record<string, string[]> = {};
      for (const c of cases) {
        if (c.report_id) {
          const rid = String(c.report_id);
          if (!fullPhotosByReport[rid]) {
            const photos = db.prepare('SELECT filename FROM photos WHERE report_id = ?').all(rid) as { filename: string }[];
            fullPhotosByReport[rid] = photos.map(p => `${baseUrl}/api/photos/${p.filename}`);
          }
        }
      }

      const wsData = cases.map((c, i) => {
        const rid = c.report_id ? String(c.report_id) : '';
        const urls = rid ? (fullPhotosByReport[rid] || []) : [];
        const row: Record<string, unknown> = {
          'Sr. No': i + 1,
          'Company Name': c.bank_name,
          'Reference Number': c.reference_number || '',
          'Date & Time': c.date_and_time || '',
          'FIR No': c.fir_no,
          'Customer Category': c.customer_category,
          'Purpose of Loan': c.purpose_of_loan,
          'Loan Amount': c.finance_amount,
          'Customer Name': c.customer_name,
          'Applicant': c.applicant,
          'Address': c.address,
          'Pin Code': c.pincode || '',
          'Location': c.location,
          'Contact Number': c.contact_number,
          'Special Remarks': c.special_remarks || '',
          'Summary Remarks': c.summary_remarks || '',
          'Verification Result': c.verification_result || '',
          'Case Status': c.case_status,
          'Field Executive': c.executive_name || 'Unassigned',
          'Executive Region': c.executive_region || '',
          'Report Status': c.report_id ? c.report_status : 'No Report',
          'Address Confirmed': c.report_id ? (c.address_confirmed ? 'YES' : 'NO') : '',
          'Person Met': c.person_met || '',
          'RVR/BVR': c.rvr_or_bvr || '',
          'GPS': c.latitude && c.longitude ? `${c.latitude},${c.longitude}` : '',
          'Photos': c.photo_count || 0,
          'Imported At': c.imported_at || '',
          'Submitted by Maker At': c.submitted_at || '',
          'Submitted by Checker At': c.approved_at || '',
          'Checker Name': c.approved_by || '',
        };
        for (let p = 0; p < Math.max(urls.length, 4); p++) {
          row[`Photo ${p + 1} URL`] = urls[p] || '';
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
        { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 20 },
        { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Full MIS');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateLabel = fromDate && toDate ? `${fromDate}_to_${toDate}` : new Date().toISOString().split('T')[0];
    const typeLabel = type === 'daily' ? 'Daily' : 'Full';
    const filename = `KOSPL_MIS_${typeLabel}_${dateLabel}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('MIS export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
