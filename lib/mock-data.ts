export interface FieldExecutive {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  region: string;
  totalVisits: number;
  avgTAT: number; // in hours
}

export interface VerificationReport {
  id: string;
  caseId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  applicationType: string;
  companyName: string;
  designation: string;
  employeeId: string;
  monthlyIncome: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  photos: {
    id: string;
    url: string;
    label: string;
    timestamp: string;
  }[];
  executiveId: string;
  executiveName: string;
  status: 'pending' | 'in_review' | 'verified' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  internalNotes: string;
  addressConfirmed: boolean;
  personMet: string;
  relationToApplicant: string;
  residenceType: string;
  residenceOwnership: string;
  yearsAtAddress: string;
  neighbourhood: string;
  landmark: string;
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
  totalVisits: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  avgTAT: number;
  todayVisits: number;
}

// Sample field executives
export const executives: FieldExecutive[] = [
  { id: 'FE001', name: 'Rajesh Kumar', email: 'rajesh.k@verify.com', phone: '+91 98765 43210', avatar: 'RK', region: 'Mumbai West', totalVisits: 147, avgTAT: 4.2 },
  { id: 'FE002', name: 'Priya Sharma', email: 'priya.s@verify.com', phone: '+91 98765 43211', avatar: 'PS', region: 'Mumbai East', totalVisits: 132, avgTAT: 3.8 },
  { id: 'FE003', name: 'Amit Patel', email: 'amit.p@verify.com', phone: '+91 98765 43212', avatar: 'AP', region: 'Thane', totalVisits: 98, avgTAT: 5.1 },
  { id: 'FE004', name: 'Sneha Reddy', email: 'sneha.r@verify.com', phone: '+91 98765 43213', avatar: 'SR', region: 'Navi Mumbai', totalVisits: 115, avgTAT: 3.5 },
  { id: 'FE005', name: 'Vikram Singh', email: 'vikram.s@verify.com', phone: '+91 98765 43214', avatar: 'VS', region: 'Pune', totalVisits: 89, avgTAT: 6.0 },
];

// Sample verification reports
export const reports: VerificationReport[] = [
  {
    id: 'VR-2026-001',
    caseId: 'CASE-8834',
    customerName: 'Anand Mehta',
    customerPhone: '+91 99887 76655',
    customerEmail: 'anand.mehta@gmail.com',
    applicationType: 'Home Loan',
    companyName: 'Tata Consultancy Services',
    designation: 'Senior Software Engineer',
    employeeId: 'TCS-44521',
    monthlyIncome: '₹1,85,000',
    address: { line1: '402, Sapphire Heights', line2: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' },
    coordinates: { lat: 19.1364, lng: 72.8296 },
    photos: [
      { id: 'p1', url: '/api/placeholder/building', label: 'Building Front', timestamp: '2026-03-01T10:30:00' },
      { id: 'p2', url: '/api/placeholder/nameplate', label: 'Name Plate', timestamp: '2026-03-01T10:31:00' },
      { id: 'p3', url: '/api/placeholder/interior', label: 'Living Room', timestamp: '2026-03-01T10:35:00' },
    ],
    executiveId: 'FE001',
    executiveName: 'Rajesh Kumar',
    status: 'approved',
    submittedAt: '2026-03-01T11:00:00',
    reviewedAt: '2026-03-01T14:30:00',
    approvedAt: '2026-03-01T16:00:00',
    internalNotes: 'Address verified. Neighbour confirmed 5+ years residence. Premium society.',
    addressConfirmed: true,
    personMet: 'Anand Mehta (Self)',
    relationToApplicant: 'Self',
    residenceType: 'Apartment',
    residenceOwnership: 'Owned',
    yearsAtAddress: '7 years',
    neighbourhood: 'Well-maintained, gated community, good locality',
    landmark: 'Near Andheri Metro Station',
    auditTrail: [
      { id: 'a1', reportId: 'VR-2026-001', action: 'Report Submitted', performedBy: 'Rajesh Kumar', performedAt: '2026-03-01T11:00:00', details: 'Field visit completed and report submitted' },
      { id: 'a2', reportId: 'VR-2026-001', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-01T14:30:00', details: 'Status updated', oldValue: 'pending', newValue: 'in_review' },
      { id: 'a3', reportId: 'VR-2026-001', action: 'Note Added', performedBy: 'Admin User', performedAt: '2026-03-01T15:00:00', details: 'Internal note added: Address verified. Neighbour confirmed.' },
      { id: 'a4', reportId: 'VR-2026-001', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-01T16:00:00', details: 'Report approved', oldValue: 'in_review', newValue: 'approved' },
    ],
  },
  {
    id: 'VR-2026-002',
    caseId: 'CASE-8835',
    customerName: 'Fatima Sheikh',
    customerPhone: '+91 88776 65544',
    customerEmail: 'fatima.sheikh@outlook.com',
    applicationType: 'Personal Loan',
    companyName: 'HDFC Bank Ltd',
    designation: 'Branch Manager',
    employeeId: 'HDFC-22190',
    monthlyIncome: '₹2,20,000',
    address: { line1: '12, Rose Villa', line2: 'Bandra East', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' },
    coordinates: { lat: 19.0596, lng: 72.8411 },
    photos: [
      { id: 'p4', url: '/api/placeholder/building', label: 'House Front', timestamp: '2026-03-01T14:15:00' },
      { id: 'p5', url: '/api/placeholder/nameplate', label: 'Name Board', timestamp: '2026-03-01T14:16:00' },
    ],
    executiveId: 'FE002',
    executiveName: 'Priya Sharma',
    status: 'verified',
    submittedAt: '2026-03-01T15:00:00',
    reviewedAt: '2026-03-02T10:00:00',
    approvedAt: null,
    internalNotes: 'Residence confirmed by security guard. Upscale neighbourhood.',
    addressConfirmed: true,
    personMet: 'Fatima Sheikh (Self)',
    relationToApplicant: 'Self',
    residenceType: 'Independent House',
    residenceOwnership: 'Owned',
    yearsAtAddress: '12 years',
    neighbourhood: 'Posh area, well-connected',
    landmark: 'Near Bandra Kurla Complex',
    auditTrail: [
      { id: 'a5', reportId: 'VR-2026-002', action: 'Report Submitted', performedBy: 'Priya Sharma', performedAt: '2026-03-01T15:00:00', details: 'Field visit completed and report submitted' },
      { id: 'a6', reportId: 'VR-2026-002', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-02T10:00:00', details: 'Status updated', oldValue: 'pending', newValue: 'verified' },
    ],
  },
  {
    id: 'VR-2026-003',
    caseId: 'CASE-8836',
    customerName: 'Ravi Deshmukh',
    customerPhone: '+91 77665 54433',
    customerEmail: 'ravi.d@yahoo.com',
    applicationType: 'Vehicle Loan',
    companyName: 'Reliance Industries',
    designation: 'Operations Manager',
    employeeId: 'RIL-67890',
    monthlyIncome: '₹1,50,000',
    address: { line1: '789, Green Park Society', line2: 'Powai', city: 'Mumbai', state: 'Maharashtra', pincode: '400076' },
    coordinates: { lat: 19.1176, lng: 72.9060 },
    photos: [
      { id: 'p7', url: '/api/placeholder/building', label: 'Society Gate', timestamp: '2026-03-02T09:20:00' },
      { id: 'p8', url: '/api/placeholder/nameplate', label: 'Flat Number', timestamp: '2026-03-02T09:22:00' },
      { id: 'p9', url: '/api/placeholder/interior', label: 'Living Area', timestamp: '2026-03-02T09:30:00' },
      { id: 'p10', url: '/api/placeholder/document', label: 'ID Proof', timestamp: '2026-03-02T09:32:00' },
    ],
    executiveId: 'FE003',
    executiveName: 'Amit Patel',
    status: 'pending',
    submittedAt: '2026-03-02T10:00:00',
    reviewedAt: null,
    approvedAt: null,
    internalNotes: '',
    addressConfirmed: true,
    personMet: 'Mrs. Deshmukh (Wife)',
    relationToApplicant: 'Spouse',
    residenceType: 'Apartment',
    residenceOwnership: 'Owned',
    yearsAtAddress: '3 years',
    neighbourhood: 'IT hub, modern township',
    landmark: 'Near Hiranandani Gardens',
    auditTrail: [
      { id: 'a7', reportId: 'VR-2026-003', action: 'Report Submitted', performedBy: 'Amit Patel', performedAt: '2026-03-02T10:00:00', details: 'Field visit completed and report submitted' },
    ],
  },
  {
    id: 'VR-2026-004',
    caseId: 'CASE-8837',
    customerName: 'Lakshmi Iyer',
    customerPhone: '+91 66554 43322',
    customerEmail: 'lakshmi.iyer@gmail.com',
    applicationType: 'Credit Card',
    companyName: 'Infosys Ltd',
    designation: 'Project Lead',
    employeeId: 'INFY-33456',
    monthlyIncome: '₹1,40,000',
    address: { line1: '55, Sea Breeze Apartments', line2: 'Juhu', city: 'Mumbai', state: 'Maharashtra', pincode: '400049' },
    coordinates: { lat: 19.1075, lng: 72.8263 },
    photos: [
      { id: 'p11', url: '/api/placeholder/building', label: 'Building View', timestamp: '2026-03-02T11:45:00' },
      { id: 'p12', url: '/api/placeholder/nameplate', label: 'Nameplate', timestamp: '2026-03-02T11:46:00' },
    ],
    executiveId: 'FE004',
    executiveName: 'Sneha Reddy',
    status: 'rejected',
    submittedAt: '2026-03-02T12:30:00',
    reviewedAt: '2026-03-02T16:00:00',
    approvedAt: null,
    internalNotes: 'Address mismatch — nameplate shows different name. Applicant not available. Neighbour unaware of applicant.',
    addressConfirmed: false,
    personMet: 'Security Guard',
    relationToApplicant: 'N/A',
    residenceType: 'Apartment',
    residenceOwnership: 'Rented',
    yearsAtAddress: 'Unknown',
    neighbourhood: 'Beach-facing, premium locality',
    landmark: 'Near Juhu Beach',
    auditTrail: [
      { id: 'a8', reportId: 'VR-2026-004', action: 'Report Submitted', performedBy: 'Sneha Reddy', performedAt: '2026-03-02T12:30:00', details: 'Field visit completed and report submitted' },
      { id: 'a9', reportId: 'VR-2026-004', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-02T16:00:00', details: 'Status updated — discrepancies found', oldValue: 'pending', newValue: 'in_review' },
      { id: 'a10', reportId: 'VR-2026-004', action: 'Note Added', performedBy: 'Admin User', performedAt: '2026-03-02T16:15:00', details: 'Address mismatch noted. Recommending rejection.' },
      { id: 'a11', reportId: 'VR-2026-004', action: 'Status Changed', performedBy: 'Senior Admin', performedAt: '2026-03-02T17:00:00', details: 'Report rejected — address not verified', oldValue: 'in_review', newValue: 'rejected' },
    ],
  },
  {
    id: 'VR-2026-005',
    caseId: 'CASE-8838',
    customerName: 'Mohammed Hussain',
    customerPhone: '+91 55443 32211',
    customerEmail: 'm.hussain@gmail.com',
    applicationType: 'Business Loan',
    companyName: 'Self Employed — Hussain Traders',
    designation: 'Proprietor',
    employeeId: 'N/A',
    monthlyIncome: '₹3,00,000',
    address: { line1: '22, Market Road', line2: 'Dadar West', city: 'Mumbai', state: 'Maharashtra', pincode: '400028' },
    coordinates: { lat: 19.0178, lng: 72.8478 },
    photos: [
      { id: 'p13', url: '/api/placeholder/building', label: 'Shop Front', timestamp: '2026-03-02T15:00:00' },
      { id: 'p14', url: '/api/placeholder/interior', label: 'Shop Interior', timestamp: '2026-03-02T15:05:00' },
      { id: 'p15', url: '/api/placeholder/document', label: 'Business License', timestamp: '2026-03-02T15:10:00' },
    ],
    executiveId: 'FE001',
    executiveName: 'Rajesh Kumar',
    status: 'in_review',
    submittedAt: '2026-03-02T16:00:00',
    reviewedAt: '2026-03-03T09:00:00',
    approvedAt: null,
    internalNotes: 'Business premises verified. Well-known trader in the area. Documents look authentic.',
    addressConfirmed: true,
    personMet: 'Mohammed Hussain (Self)',
    relationToApplicant: 'Self',
    residenceType: 'Commercial',
    residenceOwnership: 'Rented',
    yearsAtAddress: '15 years',
    neighbourhood: 'Busy commercial area, established market',
    landmark: 'Near Dadar Railway Station',
    auditTrail: [
      { id: 'a12', reportId: 'VR-2026-005', action: 'Report Submitted', performedBy: 'Rajesh Kumar', performedAt: '2026-03-02T16:00:00', details: 'Field visit completed and report submitted' },
      { id: 'a13', reportId: 'VR-2026-005', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-03T09:00:00', details: 'Taken up for review', oldValue: 'pending', newValue: 'in_review' },
      { id: 'a14', reportId: 'VR-2026-005', action: 'Note Added', performedBy: 'Admin User', performedAt: '2026-03-03T09:30:00', details: 'Business premises verified. Well-known trader.' },
    ],
  },
  {
    id: 'VR-2026-006',
    caseId: 'CASE-8839',
    customerName: 'Deepa Nair',
    customerPhone: '+91 44332 21100',
    customerEmail: 'deepa.nair@hotmail.com',
    applicationType: 'Home Loan',
    companyName: 'Wipro Technologies',
    designation: 'Technical Architect',
    employeeId: 'WIP-78901',
    monthlyIncome: '₹2,50,000',
    address: { line1: '1001, Sky Tower', line2: 'Malad West', city: 'Mumbai', state: 'Maharashtra', pincode: '400064' },
    coordinates: { lat: 19.1867, lng: 72.8484 },
    photos: [
      { id: 'p16', url: '/api/placeholder/building', label: 'Tower Entrance', timestamp: '2026-03-03T08:45:00' },
      { id: 'p17', url: '/api/placeholder/nameplate', label: 'Door Number', timestamp: '2026-03-03T08:47:00' },
      { id: 'p18', url: '/api/placeholder/interior', label: 'Flat Interior', timestamp: '2026-03-03T08:55:00' },
    ],
    executiveId: 'FE002',
    executiveName: 'Priya Sharma',
    status: 'pending',
    submittedAt: '2026-03-03T09:30:00',
    reviewedAt: null,
    approvedAt: null,
    internalNotes: '',
    addressConfirmed: true,
    personMet: 'Mr. Nair (Father)',
    relationToApplicant: 'Father',
    residenceType: 'Apartment',
    residenceOwnership: 'Owned',
    yearsAtAddress: '5 years',
    neighbourhood: 'New development, modern amenities',
    landmark: 'Near Inorbit Mall',
    auditTrail: [
      { id: 'a15', reportId: 'VR-2026-006', action: 'Report Submitted', performedBy: 'Priya Sharma', performedAt: '2026-03-03T09:30:00', details: 'Field visit completed and report submitted' },
    ],
  },
  {
    id: 'VR-2026-007',
    caseId: 'CASE-8840',
    customerName: 'Suresh Patil',
    customerPhone: '+91 33221 10099',
    customerEmail: 'suresh.patil@gmail.com',
    applicationType: 'Personal Loan',
    companyName: 'L&T Construction',
    designation: 'Site Engineer',
    employeeId: 'LT-45678',
    monthlyIncome: '₹95,000',
    address: { line1: '33-B, Shanti Nagar', line2: 'Dombivli East', city: 'Thane', state: 'Maharashtra', pincode: '421201' },
    coordinates: { lat: 19.2183, lng: 73.0867 },
    photos: [
      { id: 'p19', url: '/api/placeholder/building', label: 'Building Front', timestamp: '2026-03-03T10:10:00' },
      { id: 'p20', url: '/api/placeholder/nameplate', label: 'Nameplate', timestamp: '2026-03-03T10:12:00' },
    ],
    executiveId: 'FE003',
    executiveName: 'Amit Patel',
    status: 'pending',
    submittedAt: '2026-03-03T11:00:00',
    reviewedAt: null,
    approvedAt: null,
    internalNotes: '',
    addressConfirmed: true,
    personMet: 'Suresh Patil (Self)',
    relationToApplicant: 'Self',
    residenceType: 'Apartment',
    residenceOwnership: 'Rented',
    yearsAtAddress: '2 years',
    neighbourhood: 'Middle-class residential area',
    landmark: 'Near Dombivli Railway Station',
    auditTrail: [
      { id: 'a16', reportId: 'VR-2026-007', action: 'Report Submitted', performedBy: 'Amit Patel', performedAt: '2026-03-03T11:00:00', details: 'Field visit completed and report submitted' },
    ],
  },
  {
    id: 'VR-2026-008',
    caseId: 'CASE-8841',
    customerName: 'Kavita Joshi',
    customerPhone: '+91 22110 09988',
    customerEmail: 'kavita.joshi@gmail.com',
    applicationType: 'Education Loan',
    companyName: 'Government School Teacher',
    designation: 'Senior Teacher',
    employeeId: 'GOV-11234',
    monthlyIncome: '₹72,000',
    address: { line1: '15, Teachers Colony', line2: 'Vashi', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400703' },
    coordinates: { lat: 19.0771, lng: 72.9987 },
    photos: [
      { id: 'p21', url: '/api/placeholder/building', label: 'Colony Gate', timestamp: '2026-03-03T11:30:00' },
      { id: 'p22', url: '/api/placeholder/nameplate', label: 'House Name', timestamp: '2026-03-03T11:32:00' },
      { id: 'p23', url: '/api/placeholder/interior', label: 'Hall', timestamp: '2026-03-03T11:40:00' },
    ],
    executiveId: 'FE004',
    executiveName: 'Sneha Reddy',
    status: 'in_review',
    submittedAt: '2026-03-03T12:00:00',
    reviewedAt: '2026-03-03T14:00:00',
    approvedAt: null,
    internalNotes: 'Government employee — stable income. Colony well-maintained.',
    addressConfirmed: true,
    personMet: 'Kavita Joshi (Self)',
    relationToApplicant: 'Self',
    residenceType: 'Row House',
    residenceOwnership: 'Owned',
    yearsAtAddress: '18 years',
    neighbourhood: 'Government housing colony, safe area',
    landmark: 'Near Vashi Station',
    auditTrail: [
      { id: 'a17', reportId: 'VR-2026-008', action: 'Report Submitted', performedBy: 'Sneha Reddy', performedAt: '2026-03-03T12:00:00', details: 'Field visit completed and report submitted' },
      { id: 'a18', reportId: 'VR-2026-008', action: 'Status Changed', performedBy: 'Admin User', performedAt: '2026-03-03T14:00:00', details: 'Review started', oldValue: 'pending', newValue: 'in_review' },
    ],
  },
];

export const dashboardStats: DashboardStats = {
  totalVisits: 581,
  pendingReview: 3,
  approved: 312,
  rejected: 24,
  avgTAT: 4.5,
  todayVisits: 12,
};

// Weekly data for charts
export const weeklyData = [
  { day: 'Mon', visits: 18, approved: 14, rejected: 2 },
  { day: 'Tue', visits: 22, approved: 17, rejected: 3 },
  { day: 'Wed', visits: 15, approved: 12, rejected: 1 },
  { day: 'Thu', visits: 20, approved: 16, rejected: 2 },
  { day: 'Fri', visits: 25, approved: 20, rejected: 3 },
  { day: 'Sat', visits: 12, approved: 9, rejected: 1 },
  { day: 'Sun', visits: 5, approved: 4, rejected: 0 },
];

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verified': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_review': return 'In Review';
    case 'verified': return 'Verified';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
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
