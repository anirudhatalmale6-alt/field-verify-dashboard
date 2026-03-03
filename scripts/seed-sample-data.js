const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'fieldverify.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function genId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${ts}-${rand}`;
}

// Sample cases
const sampleCases = [
  { bank: 'State Bank of India', fir: 'SBI/MUM/2026/001', applicant: 'Rajesh Kumar Sharma', purpose: 'Home Loan', amount: '₹45,00,000', customer: 'Rajesh Kumar Sharma', address: 'Flat 302, Sunshine Apts, MG Road, Andheri West', location: 'Andheri West, Mumbai', contact: '+91 98210 45678', category: 'HOME', exec: 'FE001' },
  { bank: 'HDFC Bank', fir: 'HDFC/PUN/2026/015', applicant: 'Priya Nair', purpose: 'Business Loan', amount: '₹12,50,000', customer: 'Priya Nair', address: '12, Koregaon Park Lane 5, Near German Bakery', location: 'Koregaon Park, Pune', contact: '+91 95555 12345', category: 'OFFICE', exec: 'FE005' },
  { bank: 'ICICI Bank', fir: 'ICICI/THN/2026/042', applicant: 'Mohammed Shaikh', purpose: 'Personal Loan', amount: '₹8,00,000', customer: 'Mohammed Shaikh', address: 'B-15, Hiranandani Estate, Ghodbunder Road', location: 'Thane West, Mumbai', contact: '+91 98335 67890', category: 'HOME', exec: 'FE003' },
  { bank: 'Axis Bank', fir: 'AXIS/NMB/2026/008', applicant: 'Sonal Desai', purpose: 'Home Loan', amount: '₹65,00,000', customer: 'Sonal Desai', address: 'Plot 45, Sector 17, Vashi', location: 'Vashi, Navi Mumbai', contact: '+91 99675 33210', category: 'HOME', exec: 'FE004' },
  { bank: 'Bank of Baroda', fir: 'BOB/KLY/2026/023', applicant: 'Vikram Patil', purpose: 'Vehicle Loan', amount: '₹3,50,000', customer: 'Vikram Patil', address: 'A-Wing, Sai Darshan CHS, Kalyan East', location: 'Kalyan East, Mumbai', contact: '+91 88505 44321', category: 'OTHER', exec: 'FE007' },
  { bank: 'Punjab National Bank', fir: 'PNB/MUM/2026/017', applicant: 'Deepa Joshi', purpose: 'Education Loan', amount: '₹15,00,000', customer: 'Deepa Joshi', address: '5th Floor, Shivam Tower, Dadar TT Circle', location: 'Dadar, Mumbai', contact: '+91 97690 88765', category: 'HOME', exec: 'FE013' },
  { bank: 'Kotak Mahindra Bank', fir: 'KMB/MUM/2026/031', applicant: 'Arun Mehta', purpose: 'Business Loan', amount: '₹25,00,000', customer: 'Arun Mehta', address: '201, Crystal Plaza, Andheri-Kurla Road', location: 'Andheri East, Mumbai', contact: '+91 98201 55567', category: 'OFFICE', exec: 'FE014' },
  { bank: 'Union Bank', fir: 'UBI/BSR/2026/009', applicant: 'Kavita Pawar', purpose: 'Home Loan', amount: '₹38,00,000', customer: 'Kavita Pawar', address: 'Row House 8, Green Valley, Borivali East', location: 'Borivali East, Mumbai', contact: '+91 93215 67777', category: 'HOME', exec: 'FE015' },
  { bank: 'HDFC Bank', fir: 'HDFC/MUM/2026/055', applicant: 'Suresh Gupta', purpose: 'Personal Loan', amount: '₹5,00,000', customer: 'Suresh Gupta', address: 'C-12, Mahavir Nagar, Kandivali West', location: 'Kandivali West, Mumbai', contact: '+91 99301 22334', category: 'HOME', exec: 'FE001' },
  { bank: 'State Bank of India', fir: 'SBI/DMV/2026/044', applicant: 'Neha Kulkarni', purpose: 'Home Loan', amount: '₹52,00,000', customer: 'Neha Kulkarni', address: 'Flat 701, Lake View Residency, Dombivli East', location: 'Dombivli East, Mumbai', contact: '+91 97022 44567', category: 'HOME', exec: 'FE008' },
  { bank: 'ICICI Bank', fir: 'ICICI/VV/2026/018', applicant: 'Rahul Yadav', purpose: 'Business Loan', amount: '₹20,00,000', customer: 'Rahul Yadav', address: 'Shop 14, Vasai Trade Center, Station Road', location: 'Vasai West, Mumbai', contact: '+91 88054 99876', category: 'OFFICE', exec: 'FE010' },
  { bank: 'Axis Bank', fir: 'AXIS/BHW/2026/027', applicant: 'Manjusha Sawant', purpose: 'Home Loan', amount: '₹28,00,000', customer: 'Manjusha Sawant', address: '301, Harmony Apts, Bhiwandi Bypass Road', location: 'Bhiwandi, Mumbai', contact: '+91 93206 77543', category: 'HOME', exec: 'FE011' },
];

const insertCase = db.prepare(`INSERT INTO cases (id, bank_name, fir_no, applicant, purpose_of_loan, finance_amount, customer_name, address, location, contact_number, customer_category, executive_id, status, imported_at, import_batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'SEED-BATCH')`);

const caseIds = [];
const statuses = ['assigned', 'assigned', 'submitted', 'submitted', 'submitted', 'approved', 'approved', 'approved', 'rejected', 'in_progress', 'in_progress', 'assigned'];

for (let i = 0; i < sampleCases.length; i++) {
  const c = sampleCases[i];
  const caseId = `CASE-${String(i + 1).padStart(3, '0')}`;
  caseIds.push({ id: caseId, status: statuses[i], exec: c.exec, ...c });
  insertCase.run(caseId, c.bank, c.fir, c.applicant, c.purpose, c.amount, c.customer, c.address, c.location, c.contact, c.category, c.exec, statuses[i]);
}

console.log(`Inserted ${sampleCases.length} cases`);

// Create reports for submitted/approved/rejected cases
const insertReport = db.prepare(`INSERT INTO reports (id, case_id, executive_id, status, fir_report_given_by, fir_reference_number, customer_name, address_confirmed, person_met, landmark, rvr_or_bvr, address, location, contact_number, latitude, longitude, dob_or_age, area_of_house, type_of_house, area_in_sqft, ownership_details, staying_years, family_members, earning_members, spouse_occupation, customer_occ_category, company_name, company_address, designation, years_working, office_location, office_area_sqft, office_setup_seen, employees_seen, tpc_neighbour_name, special_remarks, internal_notes, submitted_at, reviewed_at, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), CASE WHEN ? IN ('approved','rejected','in_review','verified') THEN datetime('now', '-' || ? || ' hours') ELSE NULL END, CASE WHEN ? IN ('approved') THEN datetime('now', '-' || ? || ' hours') ELSE NULL END)`);

const insertAudit = db.prepare(`INSERT INTO audit_trail (id, report_id, case_id, action, performed_by, performed_at, details, old_value, new_value) VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), ?, ?, ?)`);

let reportCount = 0;
const reportStatuses = { 'submitted': 'pending', 'approved': 'approved', 'rejected': 'rejected' };

for (const c of caseIds) {
  if (['submitted', 'approved', 'rejected'].includes(c.status)) {
    const reportId = genId('RPT');
    const rStatus = reportStatuses[c.status];
    const hoursAgo = Math.floor(Math.random() * 48) + 2;
    const reviewHoursAgo = Math.max(hoursAgo - 4, 1);
    const approveHoursAgo = Math.max(reviewHoursAgo - 2, 0);

    insertReport.run(
      reportId, c.id, c.exec, rStatus,
      'Bank Officer', c.fir,
      c.customer, 1,
      c.customer, 'Near Main Market',
      c.category === 'OFFICE' ? 'BVR' : 'RVR',
      c.address, c.location, c.contact,
      19.0760 + (Math.random() - 0.5) * 0.1, 72.8777 + (Math.random() - 0.5) * 0.1,
      `${25 + Math.floor(Math.random() * 30)} years`,
      'NORMAL',
      JSON.stringify(['Pucca', 'Flat']),
      `${800 + Math.floor(Math.random() * 700)} sqft`,
      'OWNED',
      `${2 + Math.floor(Math.random() * 15)} years`,
      `${2 + Math.floor(Math.random() * 4)}`,
      `${1 + Math.floor(Math.random() * 3)}`,
      'Homemaker',
      'SALARIED',
      'Tata Consultancy Services', 'TCS House, Andheri', 'Senior Engineer', '5 years',
      c.location, '450 sqft', 'YES', '15+',
      'Mr. Ramesh (Neighbour)',
      'Customer is cooperative and provided all required documents. Address confirmed. Good locality.',
      rStatus === 'approved' ? 'Verified and approved. All documents in order.' : rStatus === 'rejected' ? 'Address mismatch found during verification.' : null,
      hoursAgo,
      rStatus, reviewHoursAgo,
      rStatus, approveHoursAgo
    );

    // Audit: submitted
    insertAudit.run(genId('AUD'), reportId, c.id, 'Report Submitted', c.exec, hoursAgo, `Verification report submitted for ${c.customer}`, null, 'pending');

    if (rStatus === 'approved') {
      insertAudit.run(genId('AUD'), reportId, c.id, 'Status Changed', 'Admin', reviewHoursAgo, 'Report approved after review', 'pending', 'approved');
      insertAudit.run(genId('AUD'), reportId, c.id, 'Note Added', 'Admin', approveHoursAgo, 'Verified and approved. All documents in order.', null, null);
    }
    if (rStatus === 'rejected') {
      insertAudit.run(genId('AUD'), reportId, c.id, 'Status Changed', 'Admin', reviewHoursAgo, 'Report rejected — address mismatch', 'pending', 'rejected');
    }

    reportCount++;
  }
}

console.log(`Inserted ${reportCount} reports with audit trail`);

// Add import batch record
db.prepare(`INSERT INTO import_batches (id, filename, total_rows, imported_rows, failed_rows, imported_by) VALUES (?, ?, ?, ?, ?, ?)`).run('SEED-BATCH', 'Sample_Cases.xlsx', sampleCases.length, sampleCases.length, 0, 'ADM001');

console.log('Seed data complete!');
db.close();
