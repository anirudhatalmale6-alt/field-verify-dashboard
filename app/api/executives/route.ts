import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const executives = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.phone, u.avatar, u.region, u.role, u.is_active,
        COUNT(DISTINCT c.id) as total_cases,
        COUNT(DISTINCT r.id) as total_reports,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports,
        SUM(CASE WHEN r.status = 'pending' OR r.status = 'in_review' THEN 1 ELSE 0 END) as pending_reports
      FROM users u
      LEFT JOIN cases c ON c.executive_id = u.id
      LEFT JOIN reports r ON r.executive_id = u.id
      WHERE u.role IN ('executive', 'admin')
      GROUP BY u.id
      ORDER BY total_reports DESC
    `).all();

    return NextResponse.json({ executives });
  } catch (error) {
    console.error('Executives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/executives — create a new executive (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, email, phone, region, role: requestedRole } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const role = requestedRole === 'admin' ? 'admin' : 'executive';
    const db = getDb();

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const prefix = role === 'admin' ? 'ADM' : 'FE';
    const id = generateId(prefix);
    const avatar = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
    const defaultPassword = role === 'admin' ? 'Kospl@2026' : 'Field@2026';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    db.prepare(`INSERT INTO users (id, name, email, phone, password_hash, role, avatar, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name.toUpperCase(), email, phone || '', passwordHash, role, avatar, region || '');

    return NextResponse.json({
      success: true,
      user: { id, name: name.toUpperCase(), email, phone, avatar, region, role },
      message: `${role === 'admin' ? 'Admin' : 'Executive'} created with default password: ${defaultPassword}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Create executive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/executives — update an existing user (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, name, email, phone, region, resetPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify user exists
    const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as { id: string; role: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email uniqueness if email is being changed
    if (email) {
      const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (emailCheck) {
        return NextResponse.json({ error: 'Email already in use by another user' }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name) {
      const upperName = name.toUpperCase();
      const avatar = upperName.split(' ').map((w: string) => w[0]).join('').substring(0, 2);
      updates.push('name = ?', 'avatar = ?');
      values.push(upperName, avatar);
    }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (region !== undefined) { updates.push('region = ?'); values.push(region); }

    if (resetPassword) {
      const defaultPassword = existing.role === 'admin' ? 'Kospl@2026' : 'Field@2026';
      const passwordHash = bcrypt.hashSync(defaultPassword, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({
      success: true,
      message: resetPassword
        ? `User updated and password reset to ${existing.role === 'admin' ? 'Kospl@2026' : 'Field@2026'}`
        : 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
