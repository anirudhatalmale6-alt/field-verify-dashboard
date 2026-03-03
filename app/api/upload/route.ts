import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Column mappings (Excel header → DB field)
const COLUMN_MAP: Record<string, string> = {
  'BANK NAME': 'bank_name',
  'DATE AND TIME': 'date_and_time',
  'FIR NO': 'fir_no',
  'APPLICANT': 'applicant',
  'PURPOSE OF LOAN': 'purpose_of_loan',
  'FINANCE AMOUNT': 'finance_amount',
  'NAME OF CUSTOMER': 'customer_name',
  'ADDRESS': 'address',
  'LOCATION': 'location',
  'CONTACT NUMBER': 'contact_number',
  'EXECUTIVE NAME': 'executive_name',
  'CUSTOMER CATEGORY': 'customer_category',
  'STATUS': 'status',
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, string>[];

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    // Map Excel columns to DB fields
    const mappedCases = rawData.map(row => {
      const mapped: Record<string, string> = {};
      for (const [excelCol, dbField] of Object.entries(COLUMN_MAP)) {
        // Try exact match, then case-insensitive
        const val = row[excelCol] || row[excelCol.toLowerCase()] || row[excelCol.toUpperCase()] || '';
        mapped[dbField] = String(val).trim();
      }
      return mapped;
    });

    // Insert into database
    const db = getDb();
    const batchId = generateId('BATCH');

    const insert = db.prepare(`
      INSERT INTO cases (id, bank_name, date_and_time, fir_no, applicant, purpose_of_loan, finance_amount, customer_name, address, location, contact_number, executive_id, customer_category, status, import_batch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    const insertBatch = db.transaction(() => {
      for (let i = 0; i < mappedCases.length; i++) {
        const c = mappedCases[i];
        try {
          // Validate required fields
          if (!c.customer_name && !c.fir_no) {
            errors.push(`Row ${i + 2}: Missing customer name and FIR no`);
            failed++;
            continue;
          }

          // Find executive by name
          let execId: string | null = null;
          if (c.executive_name) {
            const exec = db.prepare('SELECT id FROM users WHERE UPPER(name) = UPPER(?) AND role = ?')
              .get(c.executive_name, 'executive') as { id: string } | undefined;
            execId = exec?.id || null;
          }

          // Normalize category
          let category = (c.customer_category || 'HOME').toUpperCase();
          if (!['HOME', 'OFFICE', 'OTHER'].includes(category)) category = 'HOME';

          insert.run(
            generateId('CASE'),
            c.bank_name,
            c.date_and_time || null,
            c.fir_no,
            c.applicant,
            c.purpose_of_loan,
            c.finance_amount,
            c.customer_name,
            c.address,
            c.location,
            c.contact_number,
            execId,
            category,
            execId ? 'assigned' : 'unassigned',
            batchId,
          );
          imported++;
        } catch (e) {
          errors.push(`Row ${i + 2}: ${(e as Error).message}`);
          failed++;
        }
      }
    });

    insertBatch();

    // Log the batch
    db.prepare(`INSERT INTO import_batches (id, filename, total_rows, imported_rows, failed_rows, imported_by) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(batchId, file.name, rawData.length, imported, failed, user.id);

    return NextResponse.json({
      batchId,
      filename: file.name,
      total: rawData.length,
      imported,
      failed,
      errors: errors.slice(0, 10), // First 10 errors
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}
