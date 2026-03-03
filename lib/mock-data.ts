// ============ INTERFACES ============

export interface FieldExecutive {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  region: string;
  totalVisits: number;
  avgTAT: number;
}

export interface CaseImport {
  id: string;
  bankName: string;
  dateAndTime: string;
  firNo: string;
  applicant: string;
  purposeOfLoan: string;
  financeAmount: string;
  customerName: string;
  address: string;
  location: string;
  contactNumber: string;
  executiveName: string;
  customerCategory: 'HOME' | 'OFFICE' | 'OTHER';
  status: 'unassigned' | 'assigned' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
}

export interface VerificationReport {
  id: string;
  caseId: string;
  // Case info (from Excel import)
  bankName: string;
  firNo: string;
  applicant: string;
  purposeOfLoan: string;
  financeAmount: string;
  customerCategory: 'HOME' | 'OFFICE' | 'OTHER';
  // Section 1: Initial Info
  firReportGivenBy: string;
  firReferenceNumber: string;
  customerName: string;
  addressConfirmed: boolean;
  // Section 2: Location & Residence
  personMet: string;
  landmark: string;
  rvrOrBvr: 'RVR' | 'BVR' | 'RESI CUM OFFICE';
  // Section 3: Personal & Residence
  dobOrAge: string;
  areaOfHouse: 'NORMAL' | 'SLUM' | 'NEGATIVE AREA';
  typeOfHouse: string[];
  areaInSqft: string;
  ownershipDetails: string;
  // Section 4: Rental & Duration
  rentedOwnerName: string;
  stayingYears: string;
  familyMembers: string;
  earningMembers: string;
  // Section 5: Occupation
  spouseOccupation: string;
  spouseOccupationDetails: string;
  customerOccCategory: 'SALARIED' | 'BUSINESSMAN';
  // Section 6: If Salaried
  companyName: string;
  companyAddress: string;
  designation: string;
  yearsWorking: string;
  // Section 7: If Businessman
  businessNameAddress: string;
  officeOwnership: string;
  natureOfBusiness: string;
  yearsInBusiness: string;
  // Additional Office fields
  officeLocation: string;
  officeAreaSqft: string;
  officeSetupSeen: string;
  employeesSeen: string;
  // Section 8: Business Verification
  companyNameBoard: string;
  // Section 9: TPC
  tpcNeighbourName: string;
  // Section 10: Remarks
  specialRemarks: string;
  // System fields
  address: string;
  location: string;
  contactNumber: string;
  coordinates: { lat: number; lng: number };
  photos: { id: string; url: string; label: string; timestamp: string }[];
  executiveId: string;
  executiveName: string;
  status: 'pending' | 'in_review' | 'verified' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  internalNotes: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  reportId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface DashboardStats {
  totalCases: number;
  totalVisits: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  avgTAT: number;
  todayVisits: number;
}

// ============ EXECUTIVES (Real names from form) ============

export const executives: FieldExecutive[] = [
  { id: 'FE001', name: 'AVINASH GARJE', phone: '+91 98765 00001', avatar: 'AG', region: 'Mumbai Central', totalVisits: 147, avgTAT: 4.2 },
  { id: 'FE002', name: 'CHETAN NEWALE', phone: '+91 98765 00002', avatar: 'CN', region: 'Mumbai West', totalVisits: 132, avgTAT: 3.8 },
  { id: 'FE003', name: 'BABASAHEB WAGHMARE', phone: '+91 98765 00003', avatar: 'BW', region: 'Thane', totalVisits: 118, avgTAT: 4.5 },
  { id: 'FE004', name: 'DAVID LOPEZ', phone: '+91 98765 00004', avatar: 'DL', region: 'Navi Mumbai', totalVisits: 105, avgTAT: 5.1 },
  { id: 'FE005', name: 'DILIP PATIL', phone: '+91 98765 00005', avatar: 'DP', region: 'Pune', totalVisits: 98, avgTAT: 4.8 },
  { id: 'FE006', name: 'GANESH GANAGE', phone: '+91 98765 00006', avatar: 'GG', region: 'Mumbai East', totalVisits: 115, avgTAT: 3.5 },
  { id: 'FE007', name: 'GANESH KHOTE', phone: '+91 98765 00007', avatar: 'GK', region: 'Kalyan', totalVisits: 89, avgTAT: 5.5 },
  { id: 'FE008', name: 'HEMANTH TAMBAT', phone: '+91 98765 00008', avatar: 'HT', region: 'Dombivli', totalVisits: 102, avgTAT: 4.0 },
  { id: 'FE009', name: 'KALLESHWAR KADAM', phone: '+91 98765 00009', avatar: 'KK', region: 'Panvel', totalVisits: 95, avgTAT: 4.3 },
  { id: 'FE010', name: 'NITIN GADHAVE', phone: '+91 98765 00010', avatar: 'NG', region: 'Vasai-Virar', totalVisits: 78, avgTAT: 6.0 },
  { id: 'FE011', name: 'PRASAD OVHAL', phone: '+91 98765 00011', avatar: 'PO', region: 'Bhiwandi', totalVisits: 84, avgTAT: 5.2 },
  { id: 'FE012', name: 'PRASHANT DOLAS', phone: '+91 98765 00012', avatar: 'PD', region: 'Ulhasnagar', totalVisits: 91, avgTAT: 4.7 },
  { id: 'FE013', name: 'SATISH JAIN', phone: '+91 98765 00013', avatar: 'SJ', region: 'Dadar', totalVisits: 110, avgTAT: 3.9 },
  { id: 'FE014', name: 'SHUBHAM KAMTHE', phone: '+91 98765 00014', avatar: 'SK', region: 'Andheri', totalVisits: 99, avgTAT: 4.4 },
  { id: 'FE015', name: 'SIDDHARTH VANJARE', phone: '+91 98765 00015', avatar: 'SV', region: 'Borivali', totalVisits: 87, avgTAT: 5.0 },
];

// ============ SAMPLE CASES (Excel Import) ============

export const cases: CaseImport[] = [
  { id: 'C001', bankName: 'HDFC Bank', dateAndTime: '2026-03-01T09:00:00', firNo: 'FIR-2026-4421', applicant: 'Anand Mehta', purposeOfLoan: 'Home Loan', financeAmount: '₹45,00,000', customerName: 'Anand Mehta', address: '402, Sapphire Heights, Andheri West, Mumbai 400058', location: 'Andheri West', contactNumber: '+91 99887 76655', executiveName: 'AVINASH GARJE', customerCategory: 'HOME', status: 'submitted' },
  { id: 'C002', bankName: 'ICICI Bank', dateAndTime: '2026-03-01T09:30:00', firNo: 'FIR-2026-4422', applicant: 'Fatima Sheikh', purposeOfLoan: 'Personal Loan', financeAmount: '₹8,00,000', customerName: 'Fatima Sheikh', address: '12, Rose Villa, Bandra East, Mumbai 400051', location: 'Bandra East', contactNumber: '+91 88776 65544', executiveName: 'CHETAN NEWALE', customerCategory: 'HOME', status: 'submitted' },
  { id: 'C003', bankName: 'SBI', dateAndTime: '2026-03-02T08:00:00', firNo: 'FIR-2026-4423', applicant: 'Ravi Deshmukh', purposeOfLoan: 'Vehicle Loan', financeAmount: '₹12,00,000', customerName: 'Ravi Deshmukh', address: '789, Green Park Society, Powai, Mumbai 400076', location: 'Powai', contactNumber: '+91 77665 54433', executiveName: 'BABASAHEB WAGHMARE', customerCategory: 'HOME', status: 'assigned' },
  { id: 'C004', bankName: 'Axis Bank', dateAndTime: '2026-03-02T09:00:00', firNo: 'FIR-2026-4424', applicant: 'Lakshmi Iyer', purposeOfLoan: 'Credit Card', financeAmount: '₹3,00,000', customerName: 'Lakshmi Iyer', address: '55, Sea Breeze Apartments, Juhu, Mumbai 400049', location: 'Juhu', contactNumber: '+91 66554 43322', executiveName: 'GANESH GANAGE', customerCategory: 'HOME', status: 'submitted' },
  { id: 'C005', bankName: 'Kotak Mahindra', dateAndTime: '2026-03-02T10:00:00', firNo: 'FIR-2026-4425', applicant: 'Mohammed Hussain', purposeOfLoan: 'Business Loan', financeAmount: '₹25,00,000', customerName: 'Mohammed Hussain', address: '22, Market Road, Dadar West, Mumbai 400028', location: 'Dadar West', contactNumber: '+91 55443 32211', executiveName: 'AVINASH GARJE', customerCategory: 'OFFICE', status: 'submitted' },
  { id: 'C006', bankName: 'HDFC Bank', dateAndTime: '2026-03-03T08:00:00', firNo: 'FIR-2026-4426', applicant: 'Deepa Nair', purposeOfLoan: 'Home Loan', financeAmount: '₹60,00,000', customerName: 'Deepa Nair', address: '1001, Sky Tower, Malad West, Mumbai 400064', location: 'Malad West', contactNumber: '+91 44332 21100', executiveName: 'CHETAN NEWALE', customerCategory: 'HOME', status: 'assigned' },
  { id: 'C007', bankName: 'PNB', dateAndTime: '2026-03-03T08:30:00', firNo: 'FIR-2026-4427', applicant: 'Suresh Patil', purposeOfLoan: 'Personal Loan', financeAmount: '₹5,00,000', customerName: 'Suresh Patil', address: '33-B, Shanti Nagar, Dombivli East, Thane 421201', location: 'Dombivli East', contactNumber: '+91 33221 10099', executiveName: 'HEMANTH TAMBAT', customerCategory: 'HOME', status: 'assigned' },
  { id: 'C008', bankName: 'Bank of Baroda', dateAndTime: '2026-03-03T09:00:00', firNo: 'FIR-2026-4428', applicant: 'Kavita Joshi', purposeOfLoan: 'Education Loan', financeAmount: '₹10,00,000', customerName: 'Kavita Joshi', address: '15, Teachers Colony, Vashi, Navi Mumbai 400703', location: 'Vashi', contactNumber: '+91 22110 09988', executiveName: 'GANESH GANAGE', customerCategory: 'HOME', status: 'submitted' },
  { id: 'C009', bankName: 'Yes Bank', dateAndTime: '2026-03-03T10:00:00', firNo: 'FIR-2026-4429', applicant: 'Rajesh Sharma', purposeOfLoan: 'Business Loan', financeAmount: '₹15,00,000', customerName: 'Rajesh Sharma', address: '78, Industrial Area, Bhiwandi, Thane 421302', location: 'Bhiwandi', contactNumber: '+91 99001 12233', executiveName: 'PRASAD OVHAL', customerCategory: 'OFFICE', status: 'unassigned' },
  { id: 'C010', bankName: 'Union Bank', dateAndTime: '2026-03-03T11:00:00', firNo: 'FIR-2026-4430', applicant: 'Priya Kulkarni', purposeOfLoan: 'Home Loan', financeAmount: '₹35,00,000', customerName: 'Priya Kulkarni', address: '201, Sai Krupa, Kalyan West, Thane 421301', location: 'Kalyan West', contactNumber: '+91 88990 05566', executiveName: '', customerCategory: 'HOME', status: 'unassigned' },
];

// ============ VERIFICATION REPORTS ============

export const reports: VerificationReport[] = [
  {
    id: 'VR-2026-001', caseId: 'FIR-2026-4421',
    bankName: 'HDFC Bank', firNo: 'FIR-2026-4421', applicant: 'Anand Mehta', purposeOfLoan: 'Home Loan', financeAmount: '₹45,00,000', customerCategory: 'HOME',
    firReportGivenBy: 'AVINASH GARJE', firReferenceNumber: 'FIR-2026-4421', customerName: 'Anand Mehta', addressConfirmed: true,
    personMet: 'Anand Mehta (Self)', landmark: 'Near Andheri Metro Station', rvrOrBvr: 'RVR',
    dobOrAge: '35 years', areaOfHouse: 'NORMAL', typeOfHouse: ['FLAT'], areaInSqft: '950', ownershipDetails: 'SELF OWNED',
    rentedOwnerName: '', stayingYears: '7 years', familyMembers: 'FAMILY MEMBERS-4', earningMembers: 'EARNING -2',
    spouseOccupation: 'SPOUSE IS WORKING', spouseOccupationDetails: 'Teacher at DPS School', customerOccCategory: 'SALARIED',
    companyName: 'Tata Consultancy Services', companyAddress: 'TCS House, Andheri East', designation: 'Senior Software Engineer', yearsWorking: '8 years',
    businessNameAddress: '', officeOwnership: '', natureOfBusiness: '', yearsInBusiness: '',
    officeLocation: 'TCS House, Andheri East', officeAreaSqft: '2000+', officeSetupSeen: 'YES', employeesSeen: '50+',
    companyNameBoard: 'NA', tpcNeighbourName: 'Mr. Rajaram Patil (Neighbour, Flat 401)',
    specialRemarks: 'Well-maintained society. Customer cooperative during visit.',
    address: '402, Sapphire Heights, Andheri West, Mumbai 400058', location: 'Andheri West', contactNumber: '+91 99887 76655',
    coordinates: { lat: 19.1364, lng: 72.8296 },
    photos: [
      { id: 'p1', url: '', label: 'Building Front', timestamp: '2026-03-01T10:30:00' },
      { id: 'p2', url: '', label: 'Name Plate', timestamp: '2026-03-01T10:31:00' },
      { id: 'p3', url: '', label: 'Living Room', timestamp: '2026-03-01T10:35:00' },
    ],
    executiveId: 'FE001', executiveName: 'AVINASH GARJE',
    status: 'approved', submittedAt: '2026-03-01T11:00:00', reviewedAt: '2026-03-01T14:30:00', approvedAt: '2026-03-01T16:00:00',
    internalNotes: 'Address verified. Neighbour confirmed 5+ years residence. Premium society.',
    auditTrail: [
      { id: 'a1', reportId: 'VR-2026-001', action: 'Report Submitted', performedBy: 'AVINASH GARJE', performedAt: '2026-03-01T11:00:00', details: 'Field visit completed and report submitted via mobile app' },
      { id: 'a2', reportId: 'VR-2026-001', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-01T14:30:00', details: 'Taken up for review', oldValue: 'pending', newValue: 'in_review' },
      { id: 'a3', reportId: 'VR-2026-001', action: 'Note Added', performedBy: 'Admin', performedAt: '2026-03-01T15:00:00', details: 'Address verified. Neighbour confirmed 5+ years residence.' },
      { id: 'a4', reportId: 'VR-2026-001', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-01T16:00:00', details: 'Report approved', oldValue: 'in_review', newValue: 'approved' },
    ],
  },
  {
    id: 'VR-2026-002', caseId: 'FIR-2026-4422',
    bankName: 'ICICI Bank', firNo: 'FIR-2026-4422', applicant: 'Fatima Sheikh', purposeOfLoan: 'Personal Loan', financeAmount: '₹8,00,000', customerCategory: 'HOME',
    firReportGivenBy: 'CHETAN NEWALE', firReferenceNumber: 'FIR-2026-4422', customerName: 'Fatima Sheikh', addressConfirmed: true,
    personMet: 'Fatima Sheikh (Self)', landmark: 'Near Bandra Kurla Complex', rvrOrBvr: 'RVR',
    dobOrAge: '42 years', areaOfHouse: 'NORMAL', typeOfHouse: ['INDEPENDENT HOUSE'], areaInSqft: '1200', ownershipDetails: 'SELF OWNED',
    rentedOwnerName: '', stayingYears: '12 years', familyMembers: 'FAMILY MEMBERS-3', earningMembers: 'EARNING -1',
    spouseOccupation: 'SPOUSE IS NON WORKING', spouseOccupationDetails: '', customerOccCategory: 'SALARIED',
    companyName: 'HDFC Bank Ltd', companyAddress: 'Bandra Kurla Complex', designation: 'Branch Manager', yearsWorking: '15 years',
    businessNameAddress: '', officeOwnership: '', natureOfBusiness: '', yearsInBusiness: '',
    officeLocation: 'BKC, Bandra East', officeAreaSqft: '5000+', officeSetupSeen: 'YES', employeesSeen: '30+',
    companyNameBoard: 'NA', tpcNeighbourName: 'Mr. Ahmed Khan (Neighbour)',
    specialRemarks: '',
    address: '12, Rose Villa, Bandra East, Mumbai 400051', location: 'Bandra East', contactNumber: '+91 88776 65544',
    coordinates: { lat: 19.0596, lng: 72.8411 },
    photos: [
      { id: 'p4', url: '', label: 'House Front', timestamp: '2026-03-01T14:15:00' },
      { id: 'p5', url: '', label: 'Name Board', timestamp: '2026-03-01T14:16:00' },
    ],
    executiveId: 'FE002', executiveName: 'CHETAN NEWALE',
    status: 'verified', submittedAt: '2026-03-01T15:00:00', reviewedAt: '2026-03-02T10:00:00', approvedAt: null,
    internalNotes: 'Residence confirmed by security guard. Upscale neighbourhood.',
    auditTrail: [
      { id: 'a5', reportId: 'VR-2026-002', action: 'Report Submitted', performedBy: 'CHETAN NEWALE', performedAt: '2026-03-01T15:00:00', details: 'Field visit completed' },
      { id: 'a6', reportId: 'VR-2026-002', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-02T10:00:00', details: 'Verified', oldValue: 'pending', newValue: 'verified' },
    ],
  },
  {
    id: 'VR-2026-004', caseId: 'FIR-2026-4424',
    bankName: 'Axis Bank', firNo: 'FIR-2026-4424', applicant: 'Lakshmi Iyer', purposeOfLoan: 'Credit Card', financeAmount: '₹3,00,000', customerCategory: 'HOME',
    firReportGivenBy: 'GANESH GANAGE', firReferenceNumber: 'FIR-2026-4424', customerName: 'Lakshmi Iyer', addressConfirmed: false,
    personMet: 'Security Guard', landmark: 'Near Juhu Beach', rvrOrBvr: 'RVR',
    dobOrAge: 'Unknown', areaOfHouse: 'NORMAL', typeOfHouse: ['FLAT'], areaInSqft: 'Unknown', ownershipDetails: 'RENTED',
    rentedOwnerName: 'Unknown', stayingYears: 'Unknown', familyMembers: '', earningMembers: '',
    spouseOccupation: '', spouseOccupationDetails: '', customerOccCategory: 'SALARIED',
    companyName: '', companyAddress: '', designation: '', yearsWorking: '',
    businessNameAddress: '', officeOwnership: '', natureOfBusiness: '', yearsInBusiness: '',
    officeLocation: '', officeAreaSqft: '', officeSetupSeen: '', employeesSeen: '',
    companyNameBoard: 'NA', tpcNeighbourName: 'Security guard did not know applicant',
    specialRemarks: 'Address mismatch — nameplate shows different name. Applicant not available. Neighbour unaware of applicant. CUSTOMER SHIFTED.',
    address: '55, Sea Breeze Apartments, Juhu, Mumbai 400049', location: 'Juhu', contactNumber: '+91 66554 43322',
    coordinates: { lat: 19.1075, lng: 72.8263 },
    photos: [
      { id: 'p11', url: '', label: 'Building View', timestamp: '2026-03-02T11:45:00' },
      { id: 'p12', url: '', label: 'Nameplate (Different Name)', timestamp: '2026-03-02T11:46:00' },
    ],
    executiveId: 'FE006', executiveName: 'GANESH GANAGE',
    status: 'rejected', submittedAt: '2026-03-02T12:30:00', reviewedAt: '2026-03-02T17:00:00', approvedAt: null,
    internalNotes: 'Address mismatch. Nameplate shows different name. Customer appears to have shifted. Recommending rejection.',
    auditTrail: [
      { id: 'a8', reportId: 'VR-2026-004', action: 'Report Submitted', performedBy: 'GANESH GANAGE', performedAt: '2026-03-02T12:30:00', details: 'Field visit completed' },
      { id: 'a9', reportId: 'VR-2026-004', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-02T16:00:00', details: 'Discrepancies found', oldValue: 'pending', newValue: 'in_review' },
      { id: 'a10', reportId: 'VR-2026-004', action: 'Note Added', performedBy: 'Admin', performedAt: '2026-03-02T16:15:00', details: 'Address mismatch noted. Recommending rejection.' },
      { id: 'a11', reportId: 'VR-2026-004', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-02T17:00:00', details: 'Rejected — address not verified', oldValue: 'in_review', newValue: 'rejected' },
    ],
  },
  {
    id: 'VR-2026-005', caseId: 'FIR-2026-4425',
    bankName: 'Kotak Mahindra', firNo: 'FIR-2026-4425', applicant: 'Mohammed Hussain', purposeOfLoan: 'Business Loan', financeAmount: '₹25,00,000', customerCategory: 'OFFICE',
    firReportGivenBy: 'AVINASH GARJE', firReferenceNumber: 'FIR-2026-4425', customerName: 'Mohammed Hussain', addressConfirmed: true,
    personMet: 'Mohammed Hussain (Self)', landmark: 'Near Dadar Railway Station', rvrOrBvr: 'BVR',
    dobOrAge: '48 years', areaOfHouse: 'NORMAL', typeOfHouse: [], areaInSqft: '', ownershipDetails: '',
    rentedOwnerName: '', stayingYears: '', familyMembers: '', earningMembers: '',
    spouseOccupation: '', spouseOccupationDetails: '', customerOccCategory: 'BUSINESSMAN',
    companyName: '', companyAddress: '', designation: '', yearsWorking: '',
    businessNameAddress: 'Hussain Traders, 22 Market Road, Dadar West', officeOwnership: 'RENTED PREMISES', natureOfBusiness: 'Wholesale Trading - Textiles', yearsInBusiness: '15 years',
    officeLocation: '22, Market Road, Dadar West', officeAreaSqft: '600', officeSetupSeen: 'YES', employeesSeen: '8',
    companyNameBoard: 'COMPANY NAME BOARD SEEN', tpcNeighbourName: 'Mr. Ramesh Gupta (Adjacent shopkeeper, 20+ years)',
    specialRemarks: 'Well-known trader in the area. Good reputation among neighbouring shops.',
    address: '22, Market Road, Dadar West, Mumbai 400028', location: 'Dadar West', contactNumber: '+91 55443 32211',
    coordinates: { lat: 19.0178, lng: 72.8478 },
    photos: [
      { id: 'p13', url: '', label: 'Shop Front', timestamp: '2026-03-02T15:00:00' },
      { id: 'p14', url: '', label: 'Shop Interior', timestamp: '2026-03-02T15:05:00' },
      { id: 'p15', url: '', label: 'Name Board', timestamp: '2026-03-02T15:08:00' },
      { id: 'p16', url: '', label: 'Business License', timestamp: '2026-03-02T15:10:00' },
    ],
    executiveId: 'FE001', executiveName: 'AVINASH GARJE',
    status: 'in_review', submittedAt: '2026-03-02T16:00:00', reviewedAt: '2026-03-03T09:00:00', approvedAt: null,
    internalNotes: 'Business premises verified. Well-known trader. Documents authentic.',
    auditTrail: [
      { id: 'a12', reportId: 'VR-2026-005', action: 'Report Submitted', performedBy: 'AVINASH GARJE', performedAt: '2026-03-02T16:00:00', details: 'BVR visit completed' },
      { id: 'a13', reportId: 'VR-2026-005', action: 'Status Changed', performedBy: 'Admin', performedAt: '2026-03-03T09:00:00', details: 'Taken up for review', oldValue: 'pending', newValue: 'in_review' },
    ],
  },
  {
    id: 'VR-2026-008', caseId: 'FIR-2026-4428',
    bankName: 'Bank of Baroda', firNo: 'FIR-2026-4428', applicant: 'Kavita Joshi', purposeOfLoan: 'Education Loan', financeAmount: '₹10,00,000', customerCategory: 'HOME',
    firReportGivenBy: 'GANESH GANAGE', firReferenceNumber: 'FIR-2026-4428', customerName: 'Kavita Joshi', addressConfirmed: true,
    personMet: 'Kavita Joshi (Self)', landmark: 'Near Vashi Station', rvrOrBvr: 'RVR',
    dobOrAge: '50 years', areaOfHouse: 'NORMAL', typeOfHouse: ['INDEPENDENT HOUSE'], areaInSqft: '800', ownershipDetails: 'SELF OWNED',
    rentedOwnerName: '', stayingYears: '18 years', familyMembers: 'FAMILY MEMBERS-3', earningMembers: 'EARNING -1',
    spouseOccupation: 'SINGLE', spouseOccupationDetails: '', customerOccCategory: 'SALARIED',
    companyName: 'Government School', companyAddress: 'Vashi Sector 10', designation: 'Senior Teacher', yearsWorking: '22 years',
    businessNameAddress: '', officeOwnership: '', natureOfBusiness: '', yearsInBusiness: '',
    officeLocation: 'Govt School, Vashi Sector 10', officeAreaSqft: 'N/A', officeSetupSeen: 'YES', employeesSeen: '20+',
    companyNameBoard: 'NA', tpcNeighbourName: 'Mrs. Sunita Desai (Neighbour, 15 years)',
    specialRemarks: 'Government employee, stable income. Colony well-maintained.',
    address: '15, Teachers Colony, Vashi, Navi Mumbai 400703', location: 'Vashi', contactNumber: '+91 22110 09988',
    coordinates: { lat: 19.0771, lng: 72.9987 },
    photos: [
      { id: 'p21', url: '', label: 'Colony Gate', timestamp: '2026-03-03T11:30:00' },
      { id: 'p22', url: '', label: 'House Front', timestamp: '2026-03-03T11:32:00' },
      { id: 'p23', url: '', label: 'Hall', timestamp: '2026-03-03T11:40:00' },
    ],
    executiveId: 'FE006', executiveName: 'GANESH GANAGE',
    status: 'pending', submittedAt: '2026-03-03T12:00:00', reviewedAt: null, approvedAt: null,
    internalNotes: '',
    auditTrail: [
      { id: 'a17', reportId: 'VR-2026-008', action: 'Report Submitted', performedBy: 'GANESH GANAGE', performedAt: '2026-03-03T12:00:00', details: 'Field visit completed' },
    ],
  },
];

// ============ DASHBOARD STATS ============

export const dashboardStats: DashboardStats = {
  totalCases: 10,
  totalVisits: 581,
  pendingReview: 2,
  approved: 312,
  rejected: 24,
  avgTAT: 4.5,
  todayVisits: 12,
};

export const weeklyData = [
  { day: 'Mon', visits: 18, approved: 14, rejected: 2 },
  { day: 'Tue', visits: 22, approved: 17, rejected: 3 },
  { day: 'Wed', visits: 15, approved: 12, rejected: 1 },
  { day: 'Thu', visits: 20, approved: 16, rejected: 2 },
  { day: 'Fri', visits: 25, approved: 20, rejected: 3 },
  { day: 'Sat', visits: 12, approved: 9, rejected: 1 },
  { day: 'Sun', visits: 5, approved: 4, rejected: 0 },
];

// ============ UTILITY FUNCTIONS ============

export function getStatusColor(status: string): string {
  switch (status) {
    case 'unassigned': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'assigned': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'in_progress': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verified': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'submitted': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'unassigned': return 'Unassigned';
    case 'assigned': return 'Assigned';
    case 'in_progress': return 'In Progress';
    case 'pending': return 'Pending Review';
    case 'in_review': return 'In Review';
    case 'verified': return 'Verified';
    case 'submitted': return 'Submitted';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

export function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'HOME': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'OFFICE': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'OTHER': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}
