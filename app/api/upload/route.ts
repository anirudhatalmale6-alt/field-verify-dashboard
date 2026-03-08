import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Flexible column mappings: multiple possible Excel headers → DB field
const COLUMN_ALIASES: Record<string, string[]> = {
  bank_name: ['BANK NAME', 'BANK', 'BANK_NAME', 'BANKNAME', 'LENDER', 'LENDER NAME', 'FINANCIAL INSTITUTION', 'FI NAME'],
  date_and_time: ['DATE AND TIME', 'DATE', 'DATE_AND_TIME', 'DATETIME', 'DATE & TIME', 'ALLOCATION DATE', 'ASSIGNED DATE', 'SR DATE'],
  fir_no: ['FIR NO', 'FIR_NO', 'FIRNO', 'FIR NUMBER', 'FI NO', 'FINO', 'FI_NO', 'REFERENCE', 'REF NO', 'REF_NO', 'REFERENCE NO', 'REFERENCE NUMBER', 'SR NO', 'SRNO', 'APPLICATION NO', 'APP NO', 'CASE NO', 'CASE ID', 'FI REF NO', 'TAT NO'],
  applicant: ['APPLICANT', 'APPLICANT NAME', 'APPLICANT_NAME', 'BORROWER', 'BORROWER NAME'],
  purpose_of_loan: ['PURPOSE OF LOAN', 'PURPOSE', 'LOAN PURPOSE', 'PURPOSE_OF_LOAN', 'PRODUCT', 'LOAN TYPE', 'PRODUCT TYPE'],
  finance_amount: ['FINANCE AMOUNT', 'AMOUNT', 'LOAN AMOUNT', 'FINANCE_AMOUNT', 'LOAN AMT', 'SANCTIONED AMOUNT'],
  customer_name: ['NAME OF CUSTOMER', 'CUSTOMER NAME', 'CUSTOMER_NAME', 'NAME', 'CUSTOMER', 'CANDIDATE NAME', 'PERSON NAME', 'APPLICANT NAME'],
  address: ['ADDRESS', 'FULL ADDRESS', 'CUSTOMER ADDRESS', 'RESIDENCE ADDRESS', 'OFFICE ADDRESS', 'VERIFICATION ADDRESS', 'ADDR'],
  location: ['LOCATION', 'AREA', 'CITY', 'LOCALITY', 'ZONE', 'REGION', 'PINCODE', 'PIN CODE'],
  contact_number: ['CONTACT NUMBER', 'CONTACT', 'PHONE', 'MOBILE', 'PHONE NUMBER', 'MOBILE NUMBER', 'CONTACT_NUMBER', 'MOBILE NO', 'PHONE NO', 'TEL', 'TELEPHONE'],
  executive_name: ['EXECUTIVE NAME', 'EXECUTIVE', 'FIELD EXECUTIVE', 'FE NAME', 'ASSIGNED TO', 'EXECUTIVE_NAME', 'FE', 'AGENT', 'AGENT NAME', 'VERIFIER', 'VERIFIER NAME', 'ALLOCATED TO'],
  customer_category: ['CUSTOMER CATEGORY', 'CATEGORY', 'TYPE', 'VERIFICATION TYPE', 'CUSTOMER_CATEGORY', 'FI TYPE', 'CASE TYPE', 'RVR/BVR', 'RVR BVR', 'VISIT TYPE'],
  allocation_status: ['STATUS', 'ALLOCATION STATUS', 'FI STATUS', 'CASE STATUS', 'ALLOC STATUS'],
  district: ['DISTRICT', 'DIST', 'CITY', 'TOWN'],
};

function findColumnValue(row: Record<string, unknown>, dbField: string): string {
  const aliases = COLUMN_ALIASES[dbField] || [];
  // Try all aliases (exact match after normalizing: trim, uppercase, collapse spaces)
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
      const normalizedAlias = alias.trim().toUpperCase().replace(/\s+/g, ' ');
      if (normalizedKey === normalizedAlias) {
        return String(row[key] ?? '').trim();
      }
    }
  }
  // Second pass: partial/contains match for longer column names
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
      const normalizedAlias = alias.trim().toUpperCase().replace(/\s+/g, ' ');
      if (normalizedKey.length > 3 && normalizedAlias.length > 3 &&
          (normalizedKey.startsWith(normalizedAlias) || normalizedAlias.startsWith(normalizedKey))) {
        return String(row[key] ?? '').trim();
      }
    }
  }
  return '';
}

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
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (parseErr) {
      return NextResponse.json({ error: 'Could not read the file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file. Error: ' + (parseErr as Error).message }, { status: 400 });
    }

    // Smart sheet selection: try to find a sheet with matching columns
    // Priority: sheet named MAIN > sheet with most matching columns > first sheet
    let bestSheet = workbook.SheetNames[0];
    let bestMatchCount = 0;

    for (const sn of workbook.SheetNames) {
      // Prefer sheet named MAIN, DATA, CASES, ALLOCATION
      if (['MAIN', 'DATA', 'CASES', 'ALLOCATION', 'FI ALLOCATION'].includes(sn.toUpperCase())) {
        bestSheet = sn;
        bestMatchCount = 999; // Force selection
        break;
      }
      // Otherwise, pick the sheet with the most matching column headers
      const testSheet = workbook.Sheets[sn];
      const testData = XLSX.utils.sheet_to_json(testSheet, { defval: '' }) as Record<string, unknown>[];
      if (testData.length > 0) {
        let matchCount = 0;
        const sampleRow = testData[0];
        for (const dbField of Object.keys(COLUMN_ALIASES)) {
          if (findColumnValue(sampleRow, dbField)) matchCount++;
        }
        if (matchCount > bestMatchCount) {
          bestMatchCount = matchCount;
          bestSheet = sn;
        }
      }
    }

    console.log('Upload: Selected sheet:', bestSheet, '(from', workbook.SheetNames.join(', ') + ')');

    const sheet = workbook.Sheets[bestSheet];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty or has no data rows. Make sure data starts from row 2 (row 1 = headers). Sheet used: ' + bestSheet }, { status: 400 });
    }

    // Log detected columns for debugging
    const detectedColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
    console.log('Upload: Detected columns:', detectedColumns);
    console.log('Upload: Total rows:', rawData.length);

    // Map Excel columns to DB fields using flexible matching
    const mappedCases = rawData.map(row => {
      const mapped: Record<string, string> = {};
      for (const dbField of Object.keys(COLUMN_ALIASES)) {
        mapped[dbField] = findColumnValue(row, dbField);
      }
      return mapped;
    });

    // Insert into database
    const db = getDb();
    const batchId = generateId('BATCH');

    // Pre-load all executives for matching
    const allExecs = db.prepare('SELECT id, name FROM users WHERE role = ? AND is_active = 1').all('executive') as { id: string; name: string }[];

    const insert = db.prepare(`
      INSERT INTO cases (id, bank_name, date_and_time, fir_no, applicant, purpose_of_loan, finance_amount, customer_name, address, location, contact_number, executive_id, customer_category, status, import_batch, district)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const auditInsert = db.prepare(`INSERT INTO audit_trail (id, case_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?)`);

    let imported = 0;
    let updated = 0;
    let failed = 0;
    let skippedProtected = 0;
    let autoAssigned = 0;
    const errors: string[] = [];

    // Pre-load existing FIR numbers with their status to handle overwrites
    const existingCases = new Map<string, { id: string; status: string }>();
    (db.prepare('SELECT id, fir_no, status FROM cases').all() as { id: string; fir_no: string; status: string }[]).forEach(r => {
      existingCases.set(r.fir_no.toUpperCase().trim(), { id: r.id, status: r.status });
    });

    const updateCase = db.prepare(`
      UPDATE cases SET bank_name = ?, date_and_time = ?, applicant = ?, purpose_of_loan = ?, finance_amount = ?,
        customer_name = ?, address = ?, location = ?, contact_number = ?, executive_id = COALESCE(?, executive_id),
        customer_category = ?, status = CASE WHEN ? IS NOT NULL THEN 'assigned' ELSE status END,
        district = COALESCE(?, district)
      WHERE id = ?
    `);

    // Check if Excel has a STATUS column for selective allocation
    const hasStatusColumn = mappedCases.some(c => (c.allocation_status || '').trim() !== '');
    const ALLOCATE_STATUSES = ['ALLOCATE', 'ALLOCATED', 'ASSIGN', 'ASSIGNED', 'ACTIVE', 'YES', 'Y', 'OPEN', 'NEW'];
    const HOLD_STATUSES = ['HOLD', 'ON HOLD', 'PENDING', 'WAIT', 'NO', 'N', 'CANCEL', 'CANCELLED', 'CLOSED', 'DUPLICATE'];

    // Check if any row has a valid executive name — if none do, use round-robin auto-assignment
    const hasExecColumn = mappedCases.some(c => {
      const name = (c.executive_name || '').toUpperCase().trim();
      const junkNames = ['COPY PASTE', 'N/A', 'NA', 'TBD', 'UPDATE REPORT', 'NONE', '-', '', 'ZOGL ADDRESS'];
      return name && !junkNames.includes(name);
    });

    // Round-robin counter for auto-distribution
    let roundRobinIndex = 0;
    let holdCount = 0;

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

          // Check if FIR already exists — overwrite unless submitted/approved
          const firKey = (c.fir_no || '').toUpperCase().trim();
          const existingCase = firKey ? existingCases.get(firKey) : null;
          if (existingCase) {
            // Protect cases that are submitted (Maker) or approved (Checker)
            if (existingCase.status === 'submitted' || existingCase.status === 'approved') {
              skippedProtected++;
              continue;
            }
          }

          // Find executive by name (fuzzy match)
          let execId: string | null = null;
          if (c.executive_name) {
            const searchName = c.executive_name.toUpperCase().trim();
            // Skip junk/placeholder values
            const junkNames = ['COPY PASTE', 'N/A', 'NA', 'TBD', 'UPDATE REPORT', 'NONE', '-', '', 'ZOGL ADDRESS'];
            if (!junkNames.includes(searchName)) {
              // Try exact match first
              const exactMatch = allExecs.find(e => e.name.toUpperCase() === searchName);
              if (exactMatch) {
                execId = exactMatch.id;
              } else {
                // Try partial match: first name, last name, or substring
                const partialMatch = allExecs.find(e => {
                  const eName = e.name.toUpperCase();
                  const eFirst = eName.split(' ')[0];
                  const eLast = eName.split(' ').slice(-1)[0];
                  const sFirst = searchName.split(' ')[0];
                  const sLast = searchName.split(' ').slice(-1)[0];
                  return (
                    eName.includes(searchName) ||
                    searchName.includes(eFirst) ||
                    eFirst === sFirst ||
                    eLast === sLast ||
                    // Handle typos: check if last name matches (e.g., ZHEMANTH TAMBAT → HEMANTH TAMBAT)
                    (sLast.length > 2 && eLast === sLast) ||
                    // Check if name contains the other after removing first char (typo prefix)
                    (searchName.length > 3 && eName.includes(searchName.substring(1)))
                  );
                });
                if (partialMatch) execId = partialMatch.id;
              }
            }
          }

          // Check STATUS column: if present, only allocate rows with allocation status
          let isHold = false;
          if (hasStatusColumn) {
            const rowStatus = (c.allocation_status || '').toUpperCase().trim();
            if (HOLD_STATUSES.includes(rowStatus) || (!ALLOCATE_STATUSES.includes(rowStatus) && rowStatus !== '')) {
              // This case should be on hold — don't assign
              isHold = true;
              execId = null;
              holdCount++;
            }
          }

          // Round-robin auto-assignment when Excel has no executive column and case is not on hold
          if (!execId && !isHold && !hasExecColumn && allExecs.length > 0) {
            const exec = allExecs[roundRobinIndex % allExecs.length];
            execId = exec.id;
            roundRobinIndex++;
            autoAssigned++;
          }

          // Normalize category
          let category = (c.customer_category || 'HOME').toUpperCase().trim();
          if (category === 'RVR' || category === 'RESIDENCE' || category === 'RESIDENTIAL') category = 'HOME';
          if (category === 'BVR' || category === 'BUSINESS') category = 'OFFICE';
          if (!['HOME', 'OFFICE', 'OTHER'].includes(category)) category = 'HOME';

          if (existingCase) {
            // UPDATE existing case with new data
            updateCase.run(
              c.bank_name || 'Unknown',
              c.date_and_time || null,
              c.applicant || '',
              c.purpose_of_loan || '',
              c.finance_amount || '',
              c.customer_name || 'Unknown',
              c.address || '',
              c.location || '',
              c.contact_number || '',
              execId,       // COALESCE(?, executive_id) — keeps old exec if new is null
              category,
              execId,       // For CASE WHEN ? IS NOT NULL — sets status to 'assigned' if exec provided
              c.district || null, // COALESCE(?, district) — keeps old district if new is null
              existingCase.id,
            );

            // Log audit for overwrite
            auditInsert.run(
              generateId('AUD'),
              existingCase.id,
              'Case Updated (Excel Overwrite)',
              'System (Excel Import)',
              `Case data overwritten from re-uploaded Excel${execId ? ` — reassigned to ${allExecs.find(e => e.id === execId)?.name || 'Unknown'}` : ''}`
            );

            updated++;
          } else {
            // INSERT new case
            const caseId = generateId('CASE');

            insert.run(
              caseId,
              c.bank_name || 'Unknown',
              c.date_and_time || null,
              c.fir_no || `FIR-${Date.now()}-${i}`,
              c.applicant || '',
              c.purpose_of_loan || '',
              c.finance_amount || '',
              c.customer_name || 'Unknown',
              c.address || '',
              c.location || '',
              c.contact_number || '',
              execId,
              category,
              execId ? 'assigned' : 'unassigned',
              batchId,
              c.district || null,
            );

            // Log audit if auto-assigned
            if (execId) {
              const execName = allExecs.find(e => e.id === execId)?.name || 'Unknown';
              const assignMethod = !hasExecColumn ? 'round-robin distribution' : 'Excel data';
              auditInsert.run(
                generateId('AUD'),
                caseId,
                'Case Auto-Assigned',
                'System (Excel Import)',
                `Case auto-assigned to ${execName} based on ${assignMethod}`
              );
            }

            // Track this FIR to catch duplicates within the same file
            if (firKey) existingCases.set(firKey, { id: caseId, status: 'unassigned' });

            imported++;
          }
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

    // Show which columns were detected and matched
    const matchedFields: string[] = [];
    const unmatchedColumns: string[] = [];
    if (rawData.length > 0) {
      const sampleRow = rawData[0];
      for (const dbField of Object.keys(COLUMN_ALIASES)) {
        if (findColumnValue(sampleRow, dbField)) {
          matchedFields.push(dbField);
        }
      }
      for (const col of Object.keys(sampleRow)) {
        let matched = false;
        for (const dbField of Object.keys(COLUMN_ALIASES)) {
          if (findColumnValue({ [col]: 'test' }, dbField)) {
            matched = true;
            break;
          }
        }
        if (!matched) unmatchedColumns.push(col);
      }
    }

    return NextResponse.json({
      batchId,
      filename: file.name,
      total: rawData.length,
      imported,
      updated,
      failed,
      skippedProtected,
      autoAssigned,
      holdCount,
      errors: errors.slice(0, 10),
      detectedColumns,
      matchedFields,
      unmatchedColumns,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process Excel file: ' + (error as Error).message }, { status: 500 });
  }
}
