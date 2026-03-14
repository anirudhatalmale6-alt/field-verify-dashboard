export function getStatusColor(status: string): string {
  switch (status) {
    case 'unassigned': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'assigned': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'in_progress': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verified': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'submitted': return 'bg-purple-100 text-purple-800 border-purple-200';
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
    case 'verified': return 'Submitted by Maker';
    case 'approved': return 'Submitted by Checker';
    case 'rejected': return 'Rejected';
    case 'submitted': return 'Submitted by Maker';
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
  if (!dateStr) return 'N/A';
  // Ensure UTC timestamps from SQLite are parsed correctly (append Z if no timezone)
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A';
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}
