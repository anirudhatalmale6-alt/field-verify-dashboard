import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'fieldverify.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    -- Users table (admins + executives)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'executive')),
      avatar TEXT,
      region TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Cases imported from Excel
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      date_and_time TEXT,
      fir_no TEXT NOT NULL,
      applicant TEXT NOT NULL,
      purpose_of_loan TEXT,
      finance_amount TEXT,
      customer_name TEXT NOT NULL,
      address TEXT NOT NULL,
      location TEXT,
      contact_number TEXT,
      executive_id TEXT REFERENCES users(id),
      customer_category TEXT CHECK(customer_category IN ('HOME', 'OFFICE', 'OTHER')),
      status TEXT DEFAULT 'unassigned' CHECK(status IN ('unassigned', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected')),
      imported_at TEXT DEFAULT (datetime('now')),
      import_batch TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Verification reports (submitted by executives)
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id),
      executive_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'verified', 'approved', 'rejected')),

      -- Section 1: Initial Information
      fir_report_given_by TEXT,
      fir_reference_number TEXT,
      customer_name TEXT,
      address_confirmed INTEGER DEFAULT 0,

      -- Section 2: Location & Residence
      person_met TEXT,
      landmark TEXT,
      rvr_or_bvr TEXT CHECK(rvr_or_bvr IN ('RVR', 'BVR', 'RESI CUM OFFICE')),
      address TEXT,
      location TEXT,
      contact_number TEXT,
      latitude REAL,
      longitude REAL,

      -- Section 3: Personal & Residence
      dob_or_age TEXT,
      area_of_house TEXT,
      type_of_house TEXT, -- JSON array
      area_in_sqft TEXT,
      ownership_details TEXT,

      -- Section 4: Rental & Duration
      rented_owner_name TEXT,
      staying_years TEXT,
      family_members TEXT,
      earning_members TEXT,

      -- Section 5: Spouse & Occupation
      spouse_occupation TEXT,
      spouse_occupation_details TEXT,
      customer_occ_category TEXT CHECK(customer_occ_category IN ('SALARIED', 'BUSINESSMAN')),

      -- Section 6: Salaried
      company_name TEXT,
      company_address TEXT,
      designation TEXT,
      years_working TEXT,

      -- Section 7: Businessman
      business_name_address TEXT,
      office_ownership TEXT,
      nature_of_business TEXT,
      years_in_business TEXT,

      -- Additional Office fields
      office_location TEXT,
      office_area_sqft TEXT,
      office_setup_seen TEXT,
      employees_seen TEXT,

      -- Section 8: BVR
      company_name_board TEXT,

      -- Section 9: TPC
      tpc_neighbour_name TEXT,

      -- Section 10: Remarks
      special_remarks TEXT,

      -- Internal
      internal_notes TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      approved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Photos attached to reports
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT,
      label TEXT,
      latitude REAL,
      longitude REAL,
      captured_at TEXT,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    -- Audit trail
    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      report_id TEXT REFERENCES reports(id),
      case_id TEXT REFERENCES cases(id),
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      performed_at TEXT DEFAULT (datetime('now')),
      details TEXT,
      old_value TEXT,
      new_value TEXT
    );

    -- Import batches
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      total_rows INTEGER,
      imported_rows INTEGER,
      failed_rows INTEGER DEFAULT 0,
      imported_by TEXT REFERENCES users(id),
      imported_at TEXT DEFAULT (datetime('now'))
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id),
      receiver_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_cases_executive ON cases(executive_id);
    CREATE INDEX IF NOT EXISTS idx_cases_fir ON cases(fir_no);
    CREATE INDEX IF NOT EXISTS idx_reports_case ON reports(case_id);
    CREATE INDEX IF NOT EXISTS idx_reports_executive ON reports(executive_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_photos_report ON photos(report_id);
    CREATE INDEX IF NOT EXISTS idx_audit_report ON audit_trail(report_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_chat_pair ON chat_messages(sender_id, receiver_id);
  `);

  // Migrations
  const reportCols = db.prepare("PRAGMA table_info(reports)").all() as { name: string }[];
  if (!reportCols.find(c => c.name === 'summary_remarks')) {
    db.exec("ALTER TABLE reports ADD COLUMN summary_remarks TEXT");
  }
  if (!reportCols.find(c => c.name === 'verification_result')) {
    db.exec("ALTER TABLE reports ADD COLUMN verification_result TEXT");
  }
  if (!reportCols.find(c => c.name === 'negative_reason')) {
    db.exec("ALTER TABLE reports ADD COLUMN negative_reason TEXT");
  }

  // Migration: add location tracking columns to users
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.find(c => c.name === 'last_latitude')) {
    db.exec("ALTER TABLE users ADD COLUMN last_latitude REAL");
    db.exec("ALTER TABLE users ADD COLUMN last_longitude REAL");
    db.exec("ALTER TABLE users ADD COLUMN last_location_at TEXT");
  }

  // Migration: add lat/lng to cases for location-based sorting
  const caseCols = db.prepare("PRAGMA table_info(cases)").all() as { name: string }[];
  if (!caseCols.find(c => c.name === 'latitude')) {
    db.exec("ALTER TABLE cases ADD COLUMN latitude REAL");
    db.exec("ALTER TABLE cases ADD COLUMN longitude REAL");
  }

  // Migration: add district to cases
  if (!caseCols.find(c => c.name === 'district')) {
    db.exec("ALTER TABLE cases ADD COLUMN district TEXT");
  }

  // Migration: add reference_number and pincode to cases
  if (!caseCols.find(c => c.name === 'reference_number')) {
    db.exec("ALTER TABLE cases ADD COLUMN reference_number TEXT");
  }
  if (!caseCols.find(c => c.name === 'pincode')) {
    db.exec("ALTER TABLE cases ADD COLUMN pincode TEXT");
  }

  // Pincodes reference table for VLOOKUP (from FI Allocation PINCODES sheet)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pincodes (
      pincode TEXT PRIMARY KEY,
      sub_area TEXT,
      district TEXT
    )
  `);

  // Migration: add approved_by to reports (checker name)
  if (!reportCols.find(c => c.name === 'approved_by')) {
    db.exec("ALTER TABLE reports ADD COLUMN approved_by TEXT");
  }

  // Migration: add pushback_reason and admin_instructions to cases
  if (!caseCols.find(c => c.name === 'pushback_reason')) {
    db.exec("ALTER TABLE cases ADD COLUMN pushback_reason TEXT");
  }
  if (!caseCols.find(c => c.name === 'admin_instructions')) {
    db.exec("ALTER TABLE cases ADD COLUMN admin_instructions TEXT");
  }

  // Seed default admin if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDefaultData(db);
  }
}

function seedDefaultData(db: Database.Database) {
  const adminHash = bcrypt.hashSync('Kospl@2026', 10);

  // Admin user
  db.prepare(`INSERT INTO users (id, name, email, phone, password_hash, role, avatar, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('ADM001', 'Admin', 'admin@kospl.in', '+91 98765 00000', adminHash, 'admin', 'AD', 'Head Office');

  // Executives (from the real form)
  const execHash = bcrypt.hashSync('Field@2026', 10);
  const executives = [
    ['FE001', 'AVINASH GARJE', 'avinash@kospl.in', '+91 98765 00001', 'AG', 'Mumbai Central'],
    ['FE002', 'CHETAN NEWALE', 'chetan@kospl.in', '+91 98765 00002', 'CN', 'Mumbai West'],
    ['FE003', 'BABASAHEB WAGHMARE', 'babasaheb@kospl.in', '+91 98765 00003', 'BW', 'Thane'],
    ['FE004', 'DAVID LOPEZ', 'david@kospl.in', '+91 98765 00004', 'DL', 'Navi Mumbai'],
    ['FE005', 'DILIP PATIL', 'dilip@kospl.in', '+91 98765 00005', 'DP', 'Pune'],
    ['FE006', 'GANESH GANAGE', 'ganesh.g@kospl.in', '+91 98765 00006', 'GG', 'Mumbai East'],
    ['FE007', 'GANESH KHOTE', 'ganesh.k@kospl.in', '+91 98765 00007', 'GK', 'Kalyan'],
    ['FE008', 'HEMANTH TAMBAT', 'hemanth@kospl.in', '+91 98765 00008', 'HT', 'Dombivli'],
    ['FE009', 'KALLESHWAR KADAM', 'kalleshwar@kospl.in', '+91 98765 00009', 'KK', 'Panvel'],
    ['FE010', 'NITIN GADHAVE', 'nitin@kospl.in', '+91 98765 00010', 'NG', 'Vasai-Virar'],
    ['FE011', 'PRASAD OVHAL', 'prasad@kospl.in', '+91 98765 00011', 'PO', 'Bhiwandi'],
    ['FE012', 'PRASHANT DOLAS', 'prashant@kospl.in', '+91 98765 00012', 'PD', 'Ulhasnagar'],
    ['FE013', 'SATISH JAIN', 'satish@kospl.in', '+91 98765 00013', 'SJ', 'Dadar'],
    ['FE014', 'SHUBHAM KAMTHE', 'shubham@kospl.in', '+91 98765 00014', 'SK', 'Andheri'],
    ['FE015', 'SIDDHARTH VANJARE', 'siddharth@kospl.in', '+91 98765 00015', 'SV', 'Borivali'],
  ];

  const insertExec = db.prepare(`INSERT INTO users (id, name, email, phone, password_hash, role, avatar, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [id, name, email, phone, avatar, region] of executives) {
    insertExec.run(id, name, email, phone, execHash, 'executive', avatar, region);
  }
}

// Helper: generate unique IDs
export function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${ts}-${rand}`;
}
