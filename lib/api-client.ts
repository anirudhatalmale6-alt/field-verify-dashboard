const BASE = '';

async function fetchAPI(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    // Redirect to login if unauthorized
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}

// Auth
export async function login(email: string, password: string) {
  return fetchAPI('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetchAPI('/api/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return fetchAPI('/api/auth/me');
}

// Dashboard
export async function getDashboard() {
  return fetchAPI('/api/dashboard');
}

// Cases
export async function getCases(params?: { status?: string; category?: string; search?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.category) sp.set('category', params.category);
  if (params?.search) sp.set('search', params.search);
  return fetchAPI(`/api/cases?${sp.toString()}`);
}

export async function assignCases(caseIds: string[], executiveId: string) {
  return fetchAPI('/api/cases/assign', {
    method: 'POST',
    body: JSON.stringify({ case_ids: caseIds, executive_id: executiveId }),
  });
}

// Excel Upload
export async function uploadExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// Reports
export async function getReports(params?: { status?: string; category?: string; search?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.category) sp.set('category', params.category);
  if (params?.search) sp.set('search', params.search);
  return fetchAPI(`/api/reports?${sp.toString()}`);
}

export async function getReport(id: string) {
  return fetchAPI(`/api/reports/${id}`);
}

export async function updateReport(id: string, data: { status?: string; internal_note?: string; summary_remarks?: string; verification_result?: string; negative_reason?: string }) {
  return fetchAPI(`/api/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function submitReport(data: Record<string, unknown>) {
  return fetchAPI('/api/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Photos
export async function uploadPhotos(reportId: string, files: File[], labels: string[], coords: { lat: number; lng: number }[]) {
  const formData = new FormData();
  files.forEach(f => formData.append('photos', f));
  labels.forEach(l => formData.append('labels', l));
  coords.forEach(c => {
    formData.append('latitudes', c.lat.toString());
    formData.append('longitudes', c.lng.toString());
  });
  const res = await fetch(`/api/reports/${reportId}/photos`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// Executives
export async function getExecutives() {
  return fetchAPI('/api/executives');
}

export async function createExecutive(data: { name: string; email: string; phone?: string; region?: string; role?: string }) {
  return fetchAPI('/api/executives', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExecutive(data: { id: string; name?: string; email?: string; phone?: string; region?: string; resetPassword?: boolean }) {
  return fetchAPI('/api/executives', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Push-back
export async function pushBackCase(caseId: string, reason: string) {
  return fetchAPI('/api/cases/pushback', {
    method: 'POST',
    body: JSON.stringify({ case_id: caseId, reason }),
  });
}

// Audit
export async function getAuditTrail(action?: string) {
  const sp = new URLSearchParams();
  if (action) sp.set('action', action);
  return fetchAPI(`/api/audit?${sp.toString()}`);
}

// Chat
export async function getChatContacts() {
  return fetchAPI('/api/chat');
}

export async function getChatMessages(userId: string, after?: string) {
  const sp = new URLSearchParams({ with: userId });
  if (after) sp.set('after', after);
  return fetchAPI(`/api/chat?${sp.toString()}`);
}

export async function sendChatMessage(receiverId: string, content: string) {
  return fetchAPI('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
}
