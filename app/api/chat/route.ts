import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';

// GET: List chat contacts with last message + unread count
// or fetch messages with a specific user via ?with=userId
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const withUser = request.nextUrl.searchParams.get('with');
  const after = request.nextUrl.searchParams.get('after'); // for polling new messages

  if (withUser) {
    // Fetch messages between current user and target user
    let query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM chat_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    const params: (string | number)[] = [user.id, withUser, withUser, user.id];

    if (after) {
      query += ` AND m.created_at > ?`;
      params.push(after);
    }

    query += ` ORDER BY m.created_at ASC`;

    const messages = db.prepare(query).all(...params);

    // Mark messages from them as read
    db.prepare(`UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`)
      .run(withUser, user.id);

    return NextResponse.json({ messages });
  }

  // List contacts: for admin show all executives, for executive show all admins
  if (user.role === 'admin') {
    const contacts = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.region, u.role,
        (SELECT content FROM chat_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM chat_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      WHERE u.role = 'executive' AND u.is_active = 1
      ORDER BY last_message_at DESC NULLS LAST, u.name ASC
    `).all(user.id, user.id, user.id, user.id, user.id);

    const totalUnread = db.prepare(`SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = 0`).get(user.id) as { count: number };

    return NextResponse.json({ contacts, totalUnread: totalUnread.count });
  } else {
    // Executive: show admin contacts
    const contacts = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.region, u.role,
        (SELECT content FROM chat_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM chat_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      WHERE u.role = 'admin' AND u.is_active = 1
      ORDER BY last_message_at DESC NULLS LAST, u.name ASC
    `).all(user.id, user.id, user.id, user.id, user.id);

    const totalUnread = db.prepare(`SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = 0`).get(user.id) as { count: number };

    return NextResponse.json({ contacts, totalUnread: totalUnread.count });
  }
}

// POST: Send a message
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiver_id, content } = await request.json();

  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
  }

  const db = getDb();

  // Verify receiver exists
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);
  if (!receiver) {
    return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
  }

  const id = generateId('msg');
  db.prepare(`INSERT INTO chat_messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)`)
    .run(id, user.id, receiver_id, content.trim());

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM chat_messages m JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `).get(id);

  return NextResponse.json({ message }, { status: 201 });
}
